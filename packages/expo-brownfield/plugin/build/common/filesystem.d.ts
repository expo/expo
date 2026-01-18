import type { PlatformString } from './types';
export declare const mkdir: (path: string, recursive?: boolean) => void;
export declare const createFileFromTemplate: (template: string, at: string, platform?: PlatformString, variables?: Record<string, unknown>) => void;
export declare const createFileFromTemplateAs: (template: string, at: string, as: string, platform?: PlatformString, variables?: Record<string, unknown>) => void;
export declare const readFromTemplate: (template: string, platform?: PlatformString, variables?: Record<string, unknown>) => string;
