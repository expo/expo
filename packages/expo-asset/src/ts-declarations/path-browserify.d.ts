declare module 'path-browserify' {
  interface Path {
    join(...paths: string[]): string;
  }

  const path: Path;
  export = path;
}
