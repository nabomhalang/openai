
import { ContextDBJson } from './src/module/ContextDB';
import { VoiceVoxAPI } from './src/module/TTSaudio';
import { OpenAI } from './src/module/openai';
import { PromptMaker } from './src/module/prompt';
import { TranslateAPI } from './src/module/translate';

const args = process.argv.splice(2);

const characterName = "reiko";

// TODO: mysql로 변경하기
const contextDB = new ContextDBJson(`./src/character/${characterName}/conversation.json`);
contextDB.add("user", args[0]);

const promptMaker = new PromptMaker(contextDB, `./src/character/${characterName}/identify.txt`);

const openai = new OpenAI(process.env.OPENAI_KEY as string);
const voiceVox = new VoiceVoxAPI();
const translater = new TranslateAPI();

promptMaker.getPrompt()
  .then(async (res) => {
    const response = await openai.getResponse(res);
    contextDB.add(response?.role as string, response?.content as string);

    const translateJP = await translater.translate({text: response?.content as string, target_lang: 'JA'});
    const translateEN = await translater.translate({text: response?.content as string, target_lang: 'EN'});
    console.log(`EN: ${translateEN}\nJP: ${translateJP}\nKR: ${response?.content}`);

    // await voiceVox.text2stream(46, translateJP as string);
  })
  .catch(e => {
    console.error(e);
  })

