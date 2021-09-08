---
title: Using EAS Submit with "expo build"
sidebar_title: Using with "expo build"
---

EAS Submit is optimized to work with EAS Build, but you can also use it to upload builds produced from `expo build:[ios|android]`. To do this, you need to pass in the build artifact URL to `eas submit`.

- **Find the build artifact URL**: Navigate to the build details page on the [builds dashboard](https://expo.dev/builds), find the build that you want to upload, and copy the download URL from the "Build artifact" section (right click the download icon and copy the link).
- **Submit the build**: Follow the instructions from the [iOS submission](ios.md) and/or [Android submission](android.md) guides, but add the `--url YOUR_BUILD_ARTIFACT_URL` flag, replacing `YOUR_BUILD_ARTIFACT_URL` with your build artifact URL.
