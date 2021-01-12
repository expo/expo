import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
declare type StripePluginProps = {
    scheme: string;
    /**
     * The iOS merchant ID used for enabling Apple Pay.
     * Without this, the error "Missing merchant identifier" will be thrown on iOS.
     */
    merchantId: string;
};
export declare function ensureStripeActivity({ mainApplication, scheme, }: {
    mainApplication: AndroidConfig.Manifest.ManifestApplication;
    scheme: string;
}): AndroidConfig.Manifest.ManifestApplication;
export declare const withStripeIos: ConfigPlugin<StripePluginProps>;
declare const _default: ConfigPlugin<StripePluginProps>;
export default _default;
