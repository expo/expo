export type Path = string;

export declare class Directory {
  constructor(path: Path);
  validatePath(): void;
  delete();
  exists(): boolean;
  create();
}

export declare class File {
  constructor(path: Path);
  validatePath();
  text(): string;
  write(content: string): any;
  delete();
  exists(): boolean;
  create();
}
