import commander from 'commander';
import { FileTypeInformation, TypeInferenceOption } from '../typeInformation';
export type TypeInformationCommandCommonAllArguments = {
    inputPaths?: string[];
    modulePath?: string;
    outputPath?: string;
    typeInference?: 'NO_INFERENCE' | 'SIMPLE_INFERENCE' | 'PREPROCESS_AND_INFERENCE';
    watcher?: boolean;
    appJson?: string;
};
export declare function isSourceKittenInstalled(): boolean;
export interface ParsedArguments {
    realInputPaths: string[];
    realOutputPath?: string;
    typeInference: TypeInferenceOption;
    watcher: boolean;
    appJsonPath?: string;
}
export declare function addCommonOptions(command: commander.Command): commander.Command;
/**
 * Debounce a function to only run once after a period of inactivity
 * If called while waiting, it will reset the timer
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, timeout?: number): (...args: Parameters<T>) => void;
export declare function runCommandOnWatch(parsedArgs: ParsedArguments, command: () => Promise<void>): Promise<void>;
export declare function getFilesForGlobPattern(globPattern: string): string[] | null;
export declare function sanitizeAndValidateOutputPath(rawPath: string, isFilePath?: boolean): string | null;
export declare function parseInferenceOption(option?: string): TypeInferenceOption | null;
export declare function getPodspecFilePath(modulePath: string): string | null;
export declare function getSourceFilesGlobFromPodspecFile(podspecPath: string): string | null;
export declare function getModuleFilePathsFromPodspec(modulePath: string): string[] | null;
export declare function uniqueStrings(strings: string[]): string[];
export declare function parseCommandArguments(options: TypeInformationCommandCommonAllArguments, isOutputFile?: boolean): ParsedArguments | null;
export declare function getFileTypeInformationFromArgs({ realInputPaths, typeInference, }: {
    realInputPaths: string[];
    typeInference: TypeInferenceOption;
}): Promise<FileTypeInformation | null>;
export declare function writeStringToFileOrPrintToConsole(text: string, realOutputPath: string | undefined): void;
export declare function getContentHash(content: string): string;
export declare function contentHasChanged(fileContent: string): boolean;
export declare function insertFileHashComment(fileContent: string): string;
export declare function writeToStableFile({ filePath, content, }: {
    filePath: string;
    content: string;
}): Promise<void>;
export declare function generateConciseTsFiles(parsedArgs: ParsedArguments): Promise<void>;
