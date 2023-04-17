import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as qs from 'querystring';
import player from 'play-sound';
import { promisify } from 'util';

async function voiceVoxTts() {
    const voicevoxUrl = 'http://nabomhalang.com:50021';
    const katakanaText = 'こんにちは、マスター！今日は何かお悩みやご相談があるでしょうか？レイコがお力になれることがあれば、何でもおっしゃってくださいね！';
    const speaker = 46;

    try {
        const audioQueryParams = qs.stringify({ text: katakanaText, speaker });
        const audioQueryResponse: AxiosResponse = await axios.post(
            `${voicevoxUrl}/audio_query?${audioQueryParams}`
        );

        const synthesisParams = qs.stringify({
            speaker,
            enable_interrogative_upspeak: true,
        });
        const synthesisResponse: AxiosResponse = await axios.post(
            `${voicevoxUrl}/synthesis?${synthesisParams}`,
            audioQueryResponse.data,
            { responseType: 'arraybuffer' }
        );

        fs.writeFileSync('test.wav', Buffer.from(synthesisResponse.data));
        console.log('VoiceVox TTS 완료: test.wav 파일 생성');
    } catch (error) {
        console.error('VoiceVox TTS 오류:', error);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function playWaveFile(filePath: string): Promise<void> {
    const play = player({});

    for (var i = 0; i < 10; i++) {
        try {
            const playPromise = promisify(play.play.bind(play));
            await playPromise(filePath);
            return;
        } catch (err) {
            console.error(`Error : ${err}`);
            await sleep(2000);
        }
    }
}

voiceVoxTts().then(() => playWaveFile('./test.wav'))