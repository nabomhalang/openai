import { spawn } from 'child_process';
import { Writable, Transform } from 'stream';
import * as wav from 'wav';
import axios from 'axios';
import { PCMFormat } from 'pcm-format';

const API_KEY = 'your_openai_api_key_here';
const WHISPER_URL = 'https://api.openai.com/v1/whisper/speech-to-text';

class WavTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: string, done: () => void) {
    const pcmData = new PCMFormat(chunk, {
      bitDepth: 16,
      channels: 1,
      sampleRate: 16000,
      signed: true,
    });
    const wavData = pcmData.toWav();
    this.push(wavData);
    done();
  }
}

function recordAudio(): Transform {
  const sox = spawn('sox', ['-d', '-t', 'dat', '-']);
  return sox.stdout;
}

async function transcribe(wavStream: NodeJS.ReadableStream): Promise<string> {
  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    wavStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    wavStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    wavStream.on('error', (error) => {
      reject(error);
    });
  });

  const response = await axios.post(WHISPER_URL, buffer, {
    headers: {
      'Content-Type': 'audio/wav',
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  return response.data.text;
}

async function main() {
  console.log('음성 인식을 시작합니다. 말을 하세요.');

  const audioStream = recordAudio();
  const wavTransform = new WavTransform();
  audioStream.pipe(wavTransform);

  const text = await transcribe(wavTransform);
  console.log('음성 인식 결과:');
  console.log(text);
}

main().catch((error) => {
  console.error('오류가 발생했습니다:', error);
});
