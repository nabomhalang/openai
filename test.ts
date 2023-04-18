

import fs from "fs";
import chalk from "chalk";
import ora from 'ora'
import { convert } from "./src/module/convert";
import { program } from "commander";
import { pkg } from "./src/module/pkg";
import { OpenAI } from "./src/controllers/openai.controllers";
import { Microphone } from "./src/module/microphone";


const openai = new OpenAI(process.env.OPENAI_KEY as string);

program.name("whisper").description(pkg.description).version(pkg.version);

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
