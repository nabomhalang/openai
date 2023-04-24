

import fs from "fs";
import chalk from "chalk";
import ora from 'ora'
import { convert } from "./src/module/convert";
import { program } from "commander";
import { pkg } from "./src/utils/pkg";
import { OpenAI } from "./src/controllers/openai.controllers";
import { Microphone } from "./src/module/microphone";
import { MicrophoneTTS } from "./src/module/microphone-tts";
import { DBController } from "./src/controllers/db.controllers";
import { PromptMaker } from "./src/module/prompt";
import { VoiceVoxAPI } from "./src/module/TTSaudio";
import { TranslateAPI } from "./src/module/translate";
import { ChatCompletionResponseMessage } from "openai";
import path from "path";


program.name("whisper").description(pkg.description).version(pkg.version);

program
  .command("chatntts <characterName> <prompt>")
  .alias("vtuber")
  .description("Choose a name for your AI character")
  .option("-M, --model <model>", "Model to use", "gpt-3.5-turbo-0301")
  .option("-V, --voice <number>", "Please enter the voice number of VoiceVox", "46")
  .option("-O, --output <file>", "Output file")
  .option("-P, --prompt <prompt>", "Prompt for hints")
  .option("-M, --model <model>", "Model to use", "whisper-1")
  .option("-S, --silence <frames>", "Silence duration in frames", Number, 5)
  .option("-T, --threshold <strengh>", "Silence threshold", Number, 5000)
  .action(
    async (characterName: string, prompt: string, opts: {
      output?: string;
      model?: string;
      silence: number;
      threshold: number;
      voiceNumber?: number;
    }) => {
      const mic = new MicrophoneTTS({
        model: opts.model,
        prompt: prompt,
        silence: opts.silence,
        output: opts.output,
        threshold: opts.threshold,
        characterName: characterName,
        voiceNumber: opts.voiceNumber
      });

      mic.start();

      process.on("SIGINT", () => {
        mic.stop();
        process.exit(0);
      });

      process.on("SIGTERM", () => {
        mic.stop();
        process.exit(0);
      });
    },
  );

program
  .command("vai <characterName> <prompt>")
  .alias("ai")
  .description("Choose a name for your AI character")
  .option("-M, --model <model>", "Model to use", "gpt-3.5-turbo-0301")
  .option("-V, --voice <number>", "Please enter the voice number of VoiceVox", "46")
  .action(
    async (
      characterName: string, prompt: string, opts: { model?: string, voice?: number }
    ) => {
      if (!fs.existsSync(path.resolve(__dirname, `./src/character/${characterName}`))) {
        console.error(chalk.bold(chalk.red(`character file "${characterName}" not found`)));
        process.exit(1);
      }

      const openai = new OpenAI(process.env.OPENAI_KEY as string, opts.model as string);

      const DB = new DBController(`./src/character/${characterName}/conversation.json`);
      DB.add("user", prompt);

      const promptMaker = new PromptMaker(DB, `./src/character/${characterName}/identify.txt`);
      const voiceVox = new VoiceVoxAPI();
      const translater = new TranslateAPI();

      promptMaker.getPrompt()
        .then(async (res) => {
          const response: ChatCompletionResponseMessage = await openai.getResponse(res);
          DB.add(response.role as string, response.content as string);

          const translateJP = await translater.translate({ text: response.content as string, target_lang: 'JA' });
          const translateEN = await translater.translate({ text: response.content as string, target_lang: "EN" });
          console.log(`EN: ${chalk.blueBright(translateEN as unknown as string)}\nJP: ${chalk.blueBright(translateJP as unknown as string)}\nKR: ${chalk.blueBright(response?.content)}`);

          await voiceVox.text2stream(characterName, opts.voice as number, translateJP as unknown as string);
        })
        .catch(e => console.error(chalk.red(e)));
    }
  )

program
  .command("recognize <audio>")
  .alias("rec")
  .description("Recognize text from an audio file")
  .option("-C, --convert", "Convert source audio to mp3 file first")
  .option("-O, --output <file>", "Output file")
  .option("-M, --model <model>", "Model to use", "whisper-1")
  .option("-P, --prompt <prompt>", "Prompt for hints")
  .action(
    async (
      audio: string, opts: { convert?: string, output?: string, prompt?: string, model?: string }
    ) => {
      const openai = new OpenAI(process.env.OPENAI_KEY as string, opts.model as string);

      if (!fs.existsSync(audio)) {
        console.error(chalk.bold(chalk.red(`Audio file ${audio} not found`)));
        process.exit(1);
      }

      if (opts.convert) {
        const spinner = ora(`Convering ${audio} ...`).start();
        audio = convert(audio);
        spinner?.succeed(`Sucecessfully converted ${audio}`);
      }

      try {
        const spinner = ora(`Recognize ${audio}...`).start();
        const result = await openai.recognize(audio, { prompt: opts.prompt, model: opts.model });
        spinner?.succeed(chalk.green(`Sucecessful recognize ${audio}`));

        if (opts.output)
          fs.writeFileSync(opts.output, result);
        else
          console.log(result);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }

    }
  )


program
  .command("microphone")
  .alias("mic")
  .description("Recognize text from microphone")
  .option("-O, --output <file>", "Output file")
  .option("-P, --prompt <prompt>", "Prompt for hints")
  .option("-M, --model <model>", "Model to use", "whisper-1")
  .option("-S, --silence <frames>", "Silence duration in frames", Number, 5)
  .option("-T, --threshold <strengh>", "Silence threshold", Number, 5000)
  .action(
    async (opts: {
      output?: string;
      prompt?: string;
      model?: string;
      silence: number;
      threshold: number;
    }) => {
      const mic = new Microphone({
        model: opts.model,
        prompt: opts.prompt,
        silence: opts.silence,
        output: opts.output,
        threshold: opts.threshold,
      });

      mic.start();

      process.on("SIGINT", () => {
        mic.stop();
        process.exit(0);
      });

      process.on("SIGTERM", () => {
        mic.stop();
        process.exit(0);
      });
    },
  );


program.parse(process.argv);
