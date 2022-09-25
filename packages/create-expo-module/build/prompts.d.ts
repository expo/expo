import { PromptObject } from 'prompts';
export declare function getSlugPrompt(customTargetPath?: string | null): PromptObject<string>;
export declare function getSubstitutionDataPrompts(slug: string): Promise<PromptObject<string>[]>;
