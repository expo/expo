export type Path = string;

export declare class Directory {
  constructor(path: Path);
  path: string;
  validatePath(): void;
  delete();
  exists(): boolean;
  create();
  copy(to: Directory | File);
}

export declare class File {
  constructor(path: Path);
  path: string;
  validatePath();
  text(): string;
  write(content: string): any;
  delete();
  exists(): boolean;
  create();
  copy(to: Directory | File);
}
