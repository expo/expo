import type { ModuleIosConfig } from '../types';
import type { InlineModulesScanOptions } from './inlineModules';
export declare function getIosInlineModulesClassNames(options: InlineModulesScanOptions): Promise<ModuleIosConfig[]>;
export declare function isTargetInInlineModulesTargets({ targetName, targetPath, inlineModulesTargets, }: {
    targetName?: string;
    targetPath: string;
    inlineModulesTargets: {
        mainTarget?: string;
        targets: string[];
    };
}): boolean;
