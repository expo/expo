# Snack Runtime Bundle

This directory contains the pre-embedded Snack runtime for offline/faster loading of Snacks in Expo Go.

## Contents

| File | Description | Size |
|------|-------------|------|
| `snack-runtime.hbc` | Hermes bytecode bundle | 8.54 MB |
| `manifest.json` | Embedded manifest with asset mappings | - |
| `assets/` | 70 assets (fonts, images) | 3.95 MB |

**Total size: 12.50 MB**

## Version Information

| Property | Value |
|----------|-------|
| **Update ID** | `019c0730-5dce-76e4-a1b0-c909d61e0182` |
| **Update Group ID** | `c9fb9b03-1a02-471e-b0e0-bcce08392ce1` |
| **Runtime Version** | `exposdk:55.0.0` |
| **SDK Version** | `55.0.0` |
| **Branch** | `production` |
| **Created** | `2026-01-29T00:38:56.206Z` |
| **Downloaded** | `2026-02-04T04:54:31.831Z` |

## How to Update

```bash
# Re-download everything (skips existing files)
yarn download-snack-runtime

# Force re-download by removing the directory first
rm -rf ios/Exponent/Supporting/SnackRuntime
yarn download-snack-runtime
```

## How to Enable

Set `USE_EMBEDDED_SNACK_RUNTIME` to `true` in `EXBuildConstants.plist`.

## Related Files

- `EXAppLoaderExpoUpdates.m` - Loading logic for embedded runtime
- `cp-bundle-resources-conditionally.sh` - Build phase that copies this folder
