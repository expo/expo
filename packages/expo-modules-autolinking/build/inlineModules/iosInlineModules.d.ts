import type { ModuleIosConfig } from '../types';
export declare function getIosInlineModulesClassNames(watchedDirectories: string[], appRoot: string): Promise<ModuleIosConfig[]>;
export declare function isTargetInInlineModulesTargets({ targetPath, inlineModulesTargets, }: {
    targetPath: string;
    inlineModulesTargets: {
        all: boolean;
        targets: string[];
    };
}): boolean;
