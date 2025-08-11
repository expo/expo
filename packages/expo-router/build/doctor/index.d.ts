import type { PackageJSONConfig } from 'expo/config';
type IncorrectDependency = {
    packageName: string;
    packageType: 'dependencies' | 'devDependencies';
    expectedVersionOrRange: string;
    actualVersion: string;
};
export declare function doctor(pkg: PackageJSONConfig, appReactNavigationPath: string | undefined, { bold, learnMore, }: {
    bold: (text: string) => string;
    learnMore: (url: string, options?: {
        learnMoreMessage?: string;
        dim?: boolean;
    }) => string;
}): IncorrectDependency[];
export {};
//# sourceMappingURL=index.d.ts.map