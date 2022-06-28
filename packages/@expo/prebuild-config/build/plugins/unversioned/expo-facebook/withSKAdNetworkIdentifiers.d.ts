import { ConfigPlugin } from '@expo/config-plugins';
/**
 * Plugin to add [`SKAdNetworkIdentifier`](https://developer.apple.com/documentation/storekit/skadnetwork/configuring_the_participating_apps)s to the Info.plist safely.
 *
 *
 * @param config
 * @param props.identifiers array of lowercase string ids to push to the `SKAdNetworkItems` array in the `Info.plist`.
 */
export declare const withSKAdNetworkIdentifiers: ConfigPlugin<string[]>;
