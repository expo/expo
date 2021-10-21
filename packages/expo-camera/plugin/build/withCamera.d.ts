import { ConfigPlugin } from '@expo/config-plugins';
export declare function setGradleMaven(buildGradle: string): string;
declare const _default: ConfigPlugin<void | {
    cameraPermission?: string | undefined;
    microphonePermission?: string | undefined;
}>;
export default _default;
