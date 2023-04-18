

import fs from "fs";

export class DBController {
  private filename: string;

  constructor(filename: string) {
    this.filename = filename;

    if (!fs.existsSync(this.filename)) {
      fs.writeFileSync(this.filename, JSON.stringify({ history: [] }), {
        encoding: "utf-8"
      });
      console.log("init contextDB", this.filename);
    }

    if (fs.statSync(filename).size === 14) {
      console.log(`file is empty. ${filename}`);
      fs.writeFileSync(this.filename, JSON.stringify({ history: [] }), {
        encoding: "utf-8"
      });
      console.log("init contextDB", this.filename);
    }
  }

  add(role: string, content: string): void {
    if (content === "") return;

    const data = JSON.parse(fs.readFileSync(this.filename, { encoding: 'utf-8' })).history;
    data.push({ role: role, content: content });
    fs.writeFileSync(this.filename, JSON.stringify({ history: data }, null, "\t"), { encoding: 'utf-8' });
  }

  get(): any[] {
    return JSON.parse(fs.readFileSync(this.filename, { encoding: 'utf-8' })).history;
  }

  init(): void {
    fs.writeFileSync(this.filename, JSON.stringify({ history: [] }), { encoding: "utf-8" });
  }
}
