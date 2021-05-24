import { ConfigPlugin } from '@expo/config-plugins';
export declare function setGradlePlaceholders(buildGradle: string, placeholder: string): string;
declare const _default: ConfigPlugin<void | {
    placeholder?: string | undefined;
}>;
export default _default;
