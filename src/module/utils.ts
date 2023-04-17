

import { appendFileSync, writeFileSync } from "fs";

export function removeChars(text: string, charsToRemove: string): string {
  for (const char of charsToRemove) {
    text = text.replace(char, "");
  }

  return text;
}

export function addText(response: string, textPath: string, encoding: BufferEncoding = "utf-8", mode: "a" | "w" = "a"): void {
  switch (mode) {
    case "a":
      appendFileSync(textPath, `${response}\n`, { encoding: encoding });
      break;
    case "w":
      writeFileSync(textPath, `${response}\n`, { encoding: encoding });
      break;
  }
}
