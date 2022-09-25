declare module 'qrcode-terminal' {
  export function generate(url: string, opts: { small: boolean }, cb: (code: string) => void): void;
}
