declare module 'path-browserify' {
  interface path {
    static join(...paths: string[]): string;
  }

  const path: path;
  export = path;
}
