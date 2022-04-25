/**
 * Configuration for `expo-build-properties`
 */
export interface PluginConfigType {
    android?: {
        compileSdkVersion?: number;
        targetSdkVersion?: number;
        buildToolsVersion?: string;
        kotlinVersion?: string;
        enableProguardInReleaseBuilds?: boolean;
        extraProguardRules?: string;
        packagingOptions?: {
            pickFirst?: string[];
            exclude?: string[];
            merge?: string[];
            doNotStrip?: string[];
        };
    };
    ios?: {
        deploymentTarget?: string;
        useFrameworks?: 'static' | 'dynamic';
    };
}
export declare function validateConfig(config: any): PluginConfigType;
