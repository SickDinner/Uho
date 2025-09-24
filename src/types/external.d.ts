declare module 'tone' {
  const Tone: any;
  export = Tone;
}

declare module 'howler' {
  export class Howl {
    constructor(options: any);
    play(id?: number): number;
    stop(id?: number): void;
    fade(from: number, to: number, duration: number, id?: number): void;
    volume(value?: number, id?: number): number;
    loop(value?: boolean): boolean;
    stereo(pan?: number, id?: number): number;
    playing(id?: number): boolean;
    unload(): void;
  }

  export const Howler: {
    mute(muted: boolean): void;
    volume(volume?: number): number;
  };
}
