

import { readFileSync } from "fs";
import { join } from "path";
import { ContextDBJson } from "./ContextDB";
import { addText } from "./utils";
import type { Identify, Prompt } from "../types/prompt.types";

export class PromptMaker {
  contextDB: ContextDBJson;
  identifyPath: string;
  identify: Identify;
  outputNum: number;

  constructor(contextDB: ContextDBJson, identifyPath: string, outputNum: number = 35) {
    this.contextDB = contextDB;
    this.identifyPath = identifyPath;
    this.identify = this.getIdentify(this.identifyPath);
    this.outputNum = outputNum;
  }

  getIdentify(identifyPath: string): Identify {
    const identifyContext = readFileSync(identifyPath, 'utf8');
    return { role: "user", content: identifyContext };
  }

  getOutputFormat(): Prompt {
    const context = `
레이코로 대답하여 아래 [YOUR OUTPUT]에 채워주십시오.
 *대답은 ${this.outputNum}자로 안으로 해야 합니다.

-------

[YOUR OUTPUT]
`;
    return { role: "system", content: context };
  }

  async getPrompt(contextNum: number = 22): Promise<Prompt[]> {
    const prompt: Prompt[] = new Array<any>();
    const context: Prompt[] = this.contextDB.get().slice(-contextNum);
    const outputFormat: Prompt = this.getOutputFormat();

    prompt.push(this.identify);

    prompt.push({ role: "system", content: `아래는 지금까지의 대화입니다.` });

    context.slice(0, -1).forEach((value) => {
      prompt.push(value);
    });

    prompt.push(outputFormat);

    prompt.push({
      role: "system",
      content: `아래는 최근 대화입니다. \n * 레이코는 ${this.outputNum}자 이내로 대답해야 합니다!`
    });

    context.slice(-1).forEach((value) => {
      prompt.push(value);
    });

    addText(
      JSON.stringify({ "history": prompt }, null, "\t"),
      join(__dirname, "../character/recentlyPrompt.json")
    );

    addText(
      `프롬프트 수 ${prompt.length}, 제한 문자 수 : ${this.outputNum}자`,
      join(__dirname, "../character/recentlyPrompt.json")
    );

    return prompt;
  }
}
