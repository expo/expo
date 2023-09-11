import { PromptObject } from 'prompts';
export declare function getSlugPrompt(customTargetPath?: string | null): PromptObject<string>;
export declare function getLocalFolderNamePrompt(customTargetPath?: string | null): PromptObject<string>;
export declare function getSubstitutionDataPrompts(slug: string): Promise<PromptObject<string>[]>;
export declare function getLocalSubstitutionDataPrompts(slug: string): Promise<PromptObject<string>[]>;
