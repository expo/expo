#!/usr/bin/env node
import { FileTypeInformation, ModuleClassDeclaration } from './typeInformation';
export declare function generateTSMockForModule(module: ModuleClassDeclaration, fileTypeInformation: FileTypeInformation, includeTypes: boolean): string;
export declare function generateMocks(files: FileTypeInformation[], outputLanguage?: 'javascript' | 'typescript'): Promise<void>;
export declare function getAllExpoModulesInWorkingDirectory(): FileTypeInformation[];
//# sourceMappingURL=mockgen.d.ts.map