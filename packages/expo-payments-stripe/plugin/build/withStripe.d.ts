import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
declare type StripePluginProps = {
    scheme: string;
};
export declare function ensureStripeActivity({ mainApplication, scheme, }: {
    mainApplication: AndroidConfig.Manifest.ManifestApplication;
    scheme: string;
}): AndroidConfig.Manifest.ManifestApplication;
export declare const withStripeIos: ConfigPlugin<StripePluginProps>;
declare const _default: ConfigPlugin<StripePluginProps>;
export default _default;
