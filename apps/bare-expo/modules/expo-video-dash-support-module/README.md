# Expo Video DASH Support Module

This is a local `bare-expo` module for experimenting with native `expo-video` transport providers on Apple platforms.

It registers a `VideoAssetTransportProvider` at module startup and uses it to translate a narrow subset of SegmentBase DASH sources into HLS so they can be played by `expo-video` on iOS.

## What this module demonstrates

- how a separate Expo module can register a native `expo-video` transport provider
- how a provider can intercept matching DASH sources before playback begins
- how a DASH manifest can be translated into HLS as part of the asset-loading pipeline

## Important limitations

- This module is meant for demonstration and testing only.
- It is not a general-purpose DASH implementation.
- It only supports selected DASH sources that match the transport's assumptions.
- The current implementation is focused on SegmentBase-style manifests and does not aim to support all DASH variants.
- The transport logic is intentionally narrow and should not be treated as production-ready.

## How it works

1. `ExpoVideoDashSupportModule.swift` registers `SegmentBaseDASHToHLSVideoAssetTransportProvider` in `OnCreate`.
2. The provider checks incoming sources and only handles matching `.mpd` URLs.
3. For a matching source, it builds a `VideoAssetLoadPlan`.
4. The load plan starts a small local translation layer that exposes generated HLS playlists to AVFoundation.
5. `expo-video` then loads the translated HLS output instead of the original DASH manifest.

## Files

- `expo-module.config.json`: declares the Apple module entry point
- `ios/ExpoVideoDashSupportModule.swift`: registers and unregisters the provider
- `ios/SegmentBaseDASHToHLSTransport.swift`: contains the demo DASH-to-HLS transport implementation

## Notes

- This module depends on `expo-video`'s native transport-provider APIs.
- It is intended to live alongside the app as a local module, but the same pattern can be used in a published Expo module if needed.
