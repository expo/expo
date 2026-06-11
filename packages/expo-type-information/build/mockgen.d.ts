import { FileTypeInformation, ModuleClassDeclaration } from './typeInformation';
/**
 * This function generates a JavaScript/TypeScript mock content string for a given ModuleClassDeclaration object which is also part of the FileTypeInformation object.
 * @param module a ModuleClassDeclaration object which is a child of the fileTypeInformation object.
 * @param fileTypeInformation a FileTypeInformation object which has the context of the whole file in which the module was declared.
 * @param includeTypes when set to true, the function emits TypeScript code otherwise it emits JavaScript.
 * @returns a string which is the generated mock content.
 * @header Mocks
 */
export declare function generateTSMockForModule(module: ModuleClassDeclaration, fileTypeInformation: FileTypeInformation, includeTypes: boolean): string;
/**
 * This function generates JavaScript/TypeScript mocks for each provided `FileTypeInformation` object.
 *
 * @param files A list of `FileTypeInformation` objects with generated type information for multiple modules
 * @param outputLanguage the language to emit the mocks in
 * @returns nothing
 * @header Mocks
 */
export declare function generateMocks(files: FileTypeInformation[], outputLanguage?: 'javascript' | 'typescript'): Promise<void>;
/**
 *
 * @returns
 * @header Mocks
 */
export declare function getAllExpoModulesInWorkingDirectory(): Promise<FileTypeInformation[]>;
