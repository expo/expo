import { applyPatchToFile as applyPatchToFileCommon } from '../../common/filesystem';
export { applyPatchToFileCommon as applyPatchToFile };
export declare const mkdir: (path: string, recursive?: boolean) => void;
export declare const createFileFromTemplate: (template: string, at: string, variables?: Record<string, unknown>) => void;
export declare const createFileFromTemplateAs: (template: string, at: string, as: string, variables?: Record<string, unknown>) => void;
export declare const readFromTemplate: (template: string, variables?: Record<string, unknown>) => string;
