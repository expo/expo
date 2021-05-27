---
title: iOS Capabilities
---

When you make a change to your iOS entitlements, this change needs to be updated remotely on Apple's servers before making a production build. EAS Build automatically synchronizes your changes with Apple Developer Portal when you run `eas build`!

> This feature can be disabled with `EXPO_NO_CAPABILITY_SYNC=1 eas build`

## Entitlements

In bare workflow apps, the entitlements are read from your `ios/**/*.entitlements` file.

In managed workflow, the entitlements are read from the introspected Expo config. You can see what your introspected config looks like by running `expo config --type introspect` in your project, then look for the `ios.entitlements` object for the results.

## Enabling

If a supported entitlement is present in the entitlements file, then EAS Build will enable it on Apple Developer Portal. If the capability is already enabled, then EAS Build will skip it.

## Disabling

If a capability is enabled for your app remotely, but not present in the native entitlements file, then EAS Build will automatically disable it.

## Supported Capabilities

EAS Build will only enable capabilities that it has built-in support for, any unsupported entitlements must be manually enabled via [Apple developer portal][apple-dev-portal].

| Capability                       | Supported |
| -------------------------------- | --------- |
| HomeKit                          | ✅        |
| Hotspot                          | ✅        |
| Multipath                        | ✅        |
| SiriKit                          | ✅        |
| Wireless Accessory Configuration | ✅        |
| Extended Virtual Address Space   | ✅        |
| Access WiFi Information          | ✅        |
| Associated Domains               | ✅        |
| AutoFill Credential Provider     | ✅        |
| HealthKit                        | ✅        |
| Game Center                      | ✅        |
| ClassKit                         | ✅        |
| Data Protection                  | ✅        |
| Inter-App Audio                  | ✅        |
| Network Extensions               | ✅        |
| NFC Tag Reading                  | ✅        |
| Personal VPN                     | ✅        |
| Push Notifications               | ✅        |
| Wallet                           | ✅        |
| Sign In with Apple               | ✅        |
| Fonts                            | ✅        |
| In-App Purchase                  | ✅        |
| Apple Pay Payment Processing     | Partial   |
| iCloud                           | Partial   |
| App Groups                       | Partial   |
| App Attest                       | ❌        |
| FileProvider TestingMode         | ❌        |
| HLS Interstitial Previews        | ❌        |
| Low Latency HLS                  | ❌        |
| MDM Managed Associated Domains   | ❌        |

The unsupported capabilities either don't support iOS, or they don't have a corresponding entitlement value.

Partially supported capabilities have extra configuration which EAS Build currently does not support. This includes Apple merchant IDs, App Group IDs, and iCloud container IDs. These values must all be [configured manually](https://expo.fyi/provisioning-profile-missing-capabilities) for the time being.

## Debugging

You can run `EXPO_DEBUG=1 eas build` to get more detailed logs regarding the capability syncing.

If you have trouble using this feature, you can disable it with the environment variable `EXPO_NO_CAPABILITY_SYNC=1`.

To see all of the currently enabled capabilities, visit [Apple Developer Portal][apple-dev-portal], and find the bundle identifier matching your app, if you click on it you should see a list of all the currently enabled capabilities.

[apple-dev-portal]: https://developer.apple.com/account/resources/identifiers/list
