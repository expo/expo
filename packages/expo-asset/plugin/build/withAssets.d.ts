import { type ConfigPlugin } from 'expo/config-plugins';
export type WithAssetProps = {
    assets?: string[];
};
/**
 * @deprecated Use `WithAssetProps` instead.
 */
export type AssetProps = WithAssetProps;
declare const _default: ConfigPlugin<void | WithAssetProps>;
export default _default;
