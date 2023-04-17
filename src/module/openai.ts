

import "dotenv/config";
import { OpenAIApi, Configuration } from "openai";


export class OpenAI {
  openai: OpenAIApi;

  constructor(apikey: string) {
    this.openai = new OpenAIApi(new Configuration({ apiKey: apikey }));
  }

  async getResponse(context: any) {
    // console.log(context);

    var response;
    for (var i = 0; i < 20; i++) {
      try {
        response = await this.openai.createChatCompletion({
          model: "gpt-3.5-turbo-0301",
          messages: context
        });
        break;
      } catch (error) {
        console.error(error);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    const responseMessage = response?.data.choices[0].message;

    return responseMessage;
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
}
