import { FileTypeInformation } from '../typeInformation';
export declare const taskAll: <T, R>(inputs: T[], map: (input: T, index: number) => Promise<R>) => Promise<R[]>;
export declare function getSwiftFileTypeInformation(filePath: string): Promise<FileTypeInformation | null>;
export declare function preprocessSwiftFile(originalFileContent: string): string;
//# sourceMappingURL=sourcekittenTypeInformation.d.ts.map