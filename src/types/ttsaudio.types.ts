

export interface AudioQuery {
  speaker: number;
  text: string;
}

export interface SynthesisParams {
  speaker: number;
  audioQuery: AudioQuery;
}
