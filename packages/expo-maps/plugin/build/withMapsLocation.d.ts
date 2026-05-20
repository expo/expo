import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * Whether to add location permissions to `AndroidManifest.xml` and `Info.plist`.
     * @default false
     */
    requestLocationPermission?: boolean;
    /**
     * A string to set the `NSLocationWhenInUseUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your location"
     * @platform ios
     */
    locationPermission?: string;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
