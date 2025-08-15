import { Album } from './Album';

export declare class Asset {
  id: number;
  getHeight(): Promise<number>;
  getWidth(): Promise<number>;
  getContentUri(): Promise<string>;
  getDisplayName(): Promise<string>;
  getMimeType(): Promise<string>;
  getLocalUri(): Promise<string>;
  delete(): Promise<void>;
  static create(filePath: string, album?: Album): Promise<Asset>;
}
