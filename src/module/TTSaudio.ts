

import 'dotenv/config';
import axios, { AxiosResponse } from "axios";
import { setTimeout } from 'timers/promises';
import { exec } from "child_process";
import os from 'os';
import fs from "fs";
import qs from "querystring";
import path from "path";

export class VoiceVoxAPI {
  private BaseURL: string;
  private os: string;

  constructor() {
    this.BaseURL = process.env.VOICEVOXAPI_BASEURL as string;
    this.os = os.platform();
  }

  async sendAudioQuery(speaker: number, text: string): Promise<AxiosResponse> {
    const queryParams = qs.stringify({ text: text, speaker: speaker });
    return await axios.post(`${this.BaseURL}/audio_query?${queryParams}`);
  }

  async synthesis(speaker: number, audioQuery: AxiosResponse): Promise<AxiosResponse> {
    const queryParams = qs.stringify({ speaker: speaker, enable_interrogative_upspeak: true });
    return await axios.post(
      `${this.BaseURL}/synthesis?${queryParams}`,
      audioQuery.data,
      { responseType: 'arraybuffer' }
    );
  }

  synthesis2waveFile(synthesisRes: AxiosResponse, saveFilePath: string): void {
    fs.writeFileSync(saveFilePath, Buffer.from(synthesisRes.data));
    console.log('VoiceVox TTS 완료: test.wav 파일 생성');
  }

  async makeWaveFile(speaker: number, text: string, saveFilePath: string): Promise<void> {
    const query = await this.sendAudioQuery(speaker, text);
    const synthesisRes = await this.synthesis(speaker, query);
    this.synthesis2waveFile(synthesisRes, saveFilePath);
  }

  async playWaveFile(filePath: string): Promise<void> {
    for (var i = 0; i < 20; i++) {
      try {
        if (this.os === "win32")
          exec(`powershell -c (New-Object Media.SoundPlayer "${filePath}").PlaySync()`);
        else if (this.os === "darwin")
          exec(`afplay ${filePath}`);
        break;
      } catch {
        await setTimeout(2000);
      }
    }
  }

  async text2stream(
    characterName: string,
    speaker: number,
    text: string,
    saveFilePath = path.join(__dirname, `../character/${characterName}/test.wav`)
  ): Promise<void> {
    await this.makeWaveFile(speaker, text, saveFilePath);
    await this.playWaveFile(saveFilePath);
  }
}
