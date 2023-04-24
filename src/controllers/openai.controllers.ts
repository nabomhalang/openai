

import "dotenv/config";
import fs from "fs";
import { OpenAIApi, Configuration, ChatCompletionResponseMessage } from "openai";


export class OpenAI {
  openai: OpenAIApi;
  model: string;

  constructor(apikey: string, model: string) {
    this.openai = new OpenAIApi(new Configuration({ apiKey: apikey }));
    this.model = model;
  }

  async getResponse(context: any): Promise<ChatCompletionResponseMessage> {
    // console.log(context);

    var response;
    for (var i = 0; i < 20; i++) {
      try {
        response = await this.openai.createChatCompletion({
          model: this.model,
          messages: context
        });
        break;
      } catch (error) {
        console.error(error);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    const responseMessage = response?.data.choices[0].message;

    return responseMessage as ChatCompletionResponseMessage;
  }

  async translate(text: string, targetLanguage: string): Promise<string | undefined> {
    const prompt: string = `Translate this into ${targetLanguage}\n${text}`
    var response;

    for (var i = 0; i < 10; i++) {
      try {
        response = await this.openai.createCompletion({
          model: "text-davinci-003",
          prompt: prompt,
          temperature: 0.3,
          max_tokens: 100,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
        });
        break;
      } catch (error) {
        console.error(`Error: ${error}`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    return response?.data.choices[0].text?.trim();
  }

  async recognize(audio_file: string, { model = "whisper-1", prompt = undefined as string | undefined } = {}): Promise<string> {
    const file = fs.createReadStream(audio_file);

    const translated = await this.openai.createTranscription(file, model, prompt);
    return translated.data.text;
  }
}
