

import 'dotenv/config';
import EventEmitter from "node:events";
import fs from "node:fs";
import chalk from "chalk";
import path from "node:path";
import type { Transform } from "node:stream";
import { ChatCompletionResponseMessage, Configuration, OpenAIApi } from "openai";
import ora, { Ora } from "ora";
import { FileWriter } from "wav";
import mic from "./mic";
import { OpenAI } from '../controllers/openai.controllers';
import { DBController } from '../controllers/db.controllers';
import { PromptMaker } from './prompt';
import { VoiceVoxAPI } from './TTSaudio';
import { TranslateAPI } from './translate';

export class MicrophoneTTS extends EventEmitter {
  private mic?: any;
  private spinner?: Ora;
  private model: string;
  private prompt?: string;
  private output?: string;
  private silence: number;
  private threshold: number;
  private characterName?: string;
  private voiceNumber?: number

  constructor({
    model = "whisper-1",
    prompt = undefined as string | undefined,
    output = undefined as string | undefined,
    silence = 5,
    threshold = 5000,
    characterName = undefined as string | undefined,
    voiceNumber = undefined as number | undefined,
  } = {}) {
    super();
    this.voiceNumber = voiceNumber;
    this.characterName = characterName;
    this.model = model;
    this.prompt = prompt;
    this.output = output;
    this.silence = silence;
    this.threshold = threshold;
  }

  start(): void {
    const spinner = ora("Initializing").start();
    this.spinner = spinner;

    this.mic = mic({ exitOnSilence: this.silence, silenceThresh: this.threshold });
    const stream: Transform = this.mic.getAudioStream();

    const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_KEY }));

    const dir = path.resolve(__dirname, "../audio");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const out = this.output ? fs.createWriteStream(this.output) : undefined;

    let listening = true;

    let writer_name = `${Date.now()}.wav`;
    let writer = new FileWriter(path.resolve(dir, writer_name), {
      sampleRate: 16000,
      channels: 1,
    });

    const backward_buffers: Buffer[] = [];

    stream.on("data", async (data: Buffer) => {
      if (listening) {
        if (!spinner.isSpinning) {
          spinner.start();
        }
        spinner.text = "Listening ...";
        for (let i = 0; i < backward_buffers.length; i++) {
          writer.write(backward_buffers.shift());
        }
        writer.write(data);
      } else {
        backward_buffers.push(data);
        if (backward_buffers.length > 2) {
          backward_buffers.shift();
        }
      }
    });

    stream.on("error", async (err) => {
      spinner.fail(`Mic Error: ${err}`);
    });

    stream.on("silence", async () => {
      listening = false;
      spinner.text = "Recognizing ...";

      const reader_name = writer_name;
      const old_wirter = writer;
      writer_name = `${Date.now()}.wav`;
      writer = new FileWriter(path.resolve(dir, writer_name), {
        sampleRate: 16000,
        channels: 1,
      });
      old_wirter.end(() => {
        setTimeout(async () => {
          const size = fs.statSync(path.resolve(dir, reader_name)).size;
          if (size < 1000) {
            return;
          }

          const reader = fs.createReadStream(path.resolve(dir, reader_name));
          try {
            const trans = await openai.createTranscription(
              reader,
              this.model
            );
            const result = trans.data.text.trim();
            if (result) {
              const openai = new OpenAI(process.env.OPENAI_KEY as string, this.model);

              const DB = new DBController(`./src/character/${this.characterName}/conversation.json`);
              DB.add("user", this.prompt as string);

              const promptMaker = new PromptMaker(DB, `./src/character/${this.characterName}/identify.txt`);
              const voiceVox = new VoiceVoxAPI();
              const translater = new TranslateAPI();

              promptMaker.getPrompt()
                .then(async (res: any) => {
                  const response: ChatCompletionResponseMessage = await openai.getResponse(res);
                  DB.add(response.role as string, response.content as string);

                  const translateJP = await translater.translate({ text: response.content as string, target_lang: 'JA' });
                  const translateEN = await translater.translate({ text: response.content as string, target_lang: "EN" });
                  console.log(`EN: ${chalk.blueBright(translateEN as unknown as string)}\nJP: ${chalk.blueBright(translateJP as unknown as string)}\nKR: ${chalk.blueBright(response?.content)}`);

                  await voiceVox.text2stream(this.characterName as string, this.voiceNumber as number, translateJP as unknown as string);
                })
                .catch(e => console.error(chalk.red(e)));
            }
          } catch (err) {
            spinner.fail("Error");
            console.error(err, reader_name);
            // @ts-expect-error
            console.error(err.response.data);
            process.exit(1);
          }
        }, 100);
      });
    });

    stream.on("sound", async () => {
      listening = true;
    });

    this.mic.start();
  }

  stop(): void {
    this.spinner?.stop();
    this.mic?.stop();
  }
}