import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
export declare function ensureStripeActivity({ mainApplication, scheme, }: {
    mainApplication: AndroidConfig.Manifest.ManifestApplication;
    scheme: string;
}): AndroidConfig.Manifest.ManifestApplication;
export declare const withStripeIos: ConfigPlugin<{
    scheme: string;
}>;
declare const withStripe: ConfigPlugin<{
    scheme: string;
}>;
export default withStripe;
