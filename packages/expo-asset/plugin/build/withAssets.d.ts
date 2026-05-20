import { type ConfigPlugin } from 'expo/config-plugins';
export type AssetProps = {
    /** An array of asset files or directories to link to the native project, relative to the project root. */
    assets?: string[];
};
declare const _default: ConfigPlugin<AssetProps | null>;
export default _default;
