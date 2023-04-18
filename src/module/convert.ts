

import { spawnSync } from "child_process";
import path from 'path';


export function convert(source: string, ffmpeg = "ffmpeg"): string | any {
	const temp = path.resolve(`${path.dirname(source)}/converted_${path.basename(source).split('.')[0]}.mp3`);

	const args = [
		"-loglevel",
		"error",
		"-i",
		path.basename(source),
		"-acodec",
		"libmp3lame",
		"-ac",
		"1",
		"-ar",
		"16000",
		temp,
	];

	spawnSync(ffmpeg, args, { cwd: path.dirname(source), stdio: "ignore" });

	return temp;
}
