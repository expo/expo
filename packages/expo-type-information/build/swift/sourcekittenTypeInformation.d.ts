import { FileTypeInformation } from '../typeInformation';
export type SwiftFileTypeInformationOptions = {
    typeInference: boolean;
};
export declare function getSwiftFileTypeInformation(filePath: string, options: SwiftFileTypeInformationOptions): Promise<FileTypeInformation | null>;
export declare function preprocessSwiftFile(originalFileContent: string): string;
