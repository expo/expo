# Snack Runtime Bundle

This directory contains the pre-embedded Snack runtime JavaScript bundle for offline/faster loading of Snacks in Expo Go.

## Version Information

| Property | Value |
|----------|-------|
| **Update ID** | `019c0730-5dce-76e4-a1b0-c909d61e0182` |
| **Update Group ID** | `c9fb9b03-1a02-471e-b0e0-bcce08392ce1` |
| **Runtime Version** | `exposdk:55.0.0` |
| **SDK Version** | `55.0.0` |
| **Branch** | `production` |
| **Created** | `2026-01-29T00:38:56.206Z` |
| **Bundle Format** | Hermes JavaScript bytecode |
| **Bundle Size** | ~8.5MB |
| **Downloaded** | `2026-02-04T02:39:13.435Z` |

## How This Bundle Was Downloaded

```bash
yarn download-snack-runtime --platform ios
```

Or manually:

```bash
# 1. Fetch manifest
curl -s "https://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824/group/c9fb9b03-1a02-471e-b0e0-bcce08392ce1" \
  -H "expo-platform: ios" \
  -H "Accept: multipart/mixed" > /tmp/snack-manifest.txt

# 2. Parse manifest for launchAsset.url and extensions.assetRequestHeaders
# 3. Download bundle with authorization header
```

## How to Enable

Set the UserDefaults key `ExpoGoUseEmbeddedSnackRuntime` to `true`:

```objc
[[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"ExpoGoUseEmbeddedSnackRuntime"];
```

## Related Files

- `EXAppLoaderExpoUpdates.m` - Contains the loading logic
- `cp-bundle-resources-conditionally.sh` - Build phase that copies this folder to app bundle
- `SettingsManager.swift` - Swift interface for the flag
