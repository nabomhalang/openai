// types/pcm-format.d.ts
declare module 'pcm-format' {
    interface PCMOptions {
        bitDepth: number;
        channels: number;
        sampleRate: number;
        signed: boolean;
    }

    class PCMFormat {
        constructor(data: Buffer, options: PCMOptions);
        toWav(): Buffer;
    }

    export { PCMFormat };
}
