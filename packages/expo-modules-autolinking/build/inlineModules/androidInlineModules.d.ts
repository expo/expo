import type { InlineModulesMirror } from './inlineModules';
export declare function createSymlinksToKotlinFiles(mirrorPath: string, inlineModulesMirror: InlineModulesMirror): Promise<void>;
export declare function getClassName(classNameWithPackage: string): string;
export declare function generateInlineModulesListFile(inlineModulesListPath: string, inlineModulesMirror: InlineModulesMirror): Promise<void>;
