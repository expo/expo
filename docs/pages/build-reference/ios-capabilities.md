---
title: iOS Capabilities
---

import { YesIcon, NoIcon } from '~/ui/components/DocIcons';

When you make a change to your iOS entitlements, this change needs to be updated remotely on Apple's servers before making a production build. EAS Build automatically synchronizes capabilities on the Apple Developer Portal with your local entitlements configuration when you run `eas build`. Capabilities are web services provided by Apple, think of them like AWS or Firebase services.

> This feature can be disabled with `EXPO_NO_CAPABILITY_SYNC=1 eas build`

## Entitlements

In bare workflow apps, the entitlements are read from your `ios/**/*.entitlements` file.

In managed workflow, the entitlements are read from the introspected Expo config. You can see what your introspected config looks like by running `expo config --type introspect` in your project, then look for the `ios.entitlements` object for the results.

## Enabling

If a supported entitlement is present in the entitlements file, then running `eas build` will enable it on Apple Developer Portal. If the capability is already enabled, then EAS Build will skip it.

## Disabling

If a capability is enabled for your app remotely, but not present in the native entitlements file, then running `eas build` will automatically disable it.

## Supported Capabilities

EAS Build will only enable capabilities that it has built-in support for, any unsupported entitlements must be manually enabled via [Apple Developer Portal][apple-dev-portal].

| Capability                                        | Supported   |
| ------------------------------------------------- | ----------- |
| Access WiFi Information                           | <YesIcon /> |
| App Attest                                        | <YesIcon /> |
| App Groups                                        | <YesIcon /> |
| Apple Pay Payment Processing                      | <YesIcon /> |
| Associated Domains                                | <YesIcon /> |
| AutoFill Credential Provider                      | <YesIcon /> |
| ClassKit                                          | <YesIcon /> |
| Communicates with Drivers                         | <YesIcon /> |
| Communication Notifications                       | <YesIcon /> |
| Custom Network Protocol                           | <YesIcon /> |
| Data Protection                                   | <YesIcon /> |
| DriverKit Allow Third Party UserClients           | <YesIcon /> |
| DriverKit Family Audio (development)              | <YesIcon /> |
| DriverKit Family HID Device (development)         | <YesIcon /> |
| DriverKit Family HID EventService (development)   | <YesIcon /> |
| DriverKit Family Networking (development)         | <YesIcon /> |
| DriverKit Family SCSIController (development)     | <YesIcon /> |
| DriverKit Family Serial (development)             | <YesIcon /> |
| DriverKit Transport HID (development)             | <YesIcon /> |
| DriverKit USB Transport (development)             | <YesIcon /> |
| DriverKit for Development                         | <YesIcon /> |
| Extended Virtual Address Space                    | <YesIcon /> |
| Family Controls                                   | <YesIcon /> |
| FileProvider TestingMode                          | <YesIcon /> |
| Fonts                                             | <YesIcon /> |
| Group Activities                                  | <YesIcon /> |
| HealthKit                                         | <YesIcon /> |
| HomeKit                                           | <YesIcon /> |
| Hotspot                                           | <YesIcon /> |
| Increased Memory Limit                            | <YesIcon /> |
| Inter-App Audio                                   | <YesIcon /> |
| Low Latency HLS                                   | <YesIcon /> |
| MDM Managed Associated Domains                    | <YesIcon /> |
| Maps                                              | <YesIcon /> |
| Media Device Discovery                            | <YesIcon /> |
| Multipath                                         | <YesIcon /> |
| NFC Tag Reading                                   | <YesIcon /> |
| Network Extensions                                | <YesIcon /> |
| On Demand Install Capable for App Clip Extensions | <YesIcon /> |
| Personal VPN                                      | <YesIcon /> |
| Push Notifications                                | <YesIcon /> |
| Push to Talk                                      | <YesIcon /> |
| Recalibrate Estimates                             | <YesIcon /> |
| Shared with You                                   | <YesIcon /> |
| Sign In with Apple                                | <YesIcon /> |
| SiriKit                                           | <YesIcon /> |
| System Extension                                  | <YesIcon /> |
| TV Services                                       | <YesIcon /> |
| Time Sensitive Notifications                      | <YesIcon /> |
| Wallet                                            | <YesIcon /> |
| WeatherKit                                        | <YesIcon /> |
| Wireless Accessory Configuration                  | <YesIcon /> |
| iCloud                                            | <YesIcon /> |
| HLS Interstitial Previews                         | <NoIcon />  |

The unsupported capabilities either don't support iOS, or they don't have a corresponding entitlement value.

Partially supported capabilities have extra configuration which EAS Build currently does not support. This includes Apple merchant IDs, App Group IDs, and iCloud container IDs. These values must all be [configured manually](https://expo.fyi/provisioning-profile-missing-capabilities) for the time being. You can also refer to this [Apple doc](https://developer.apple.com/documentation/xcode/adding-capabilities-to-your-app) for more information on manual setup.

## Debugging

You can run `EXPO_DEBUG=1 eas build` to get more detailed logs regarding the capability syncing.

If you have trouble using this feature, you can disable it with the environment variable `EXPO_NO_CAPABILITY_SYNC=1`.

To see all of the currently enabled capabilities, visit [Apple Developer Portal][apple-dev-portal], and find the bundle identifier matching your app, if you click on it you should see a list of all the currently enabled capabilities.

[apple-dev-portal]: https://developer.apple.com/account/resources/identifiers/list
