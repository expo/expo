# Changelog

## Unpublished

### New features

- Add inclusive `minimum` and `maximum` schema bounds for numbers and integers, using native generation guides on Apple and library validation with bounded repairs on Android and Web. ([#49997](https://github.com/expo/expo/pull/49997), [#49998](https://github.com/expo/expo/pull/49998) by [@chrfalch](https://github.com/chrfalch))
- Document the Android minimum SDK and Kotlin compiler settings with `expo-build-properties`. ([#50001](https://github.com/expo/expo/pull/50001) by [@chrfalch](https://github.com/chrfalch))
- Add Apple image input with native vision capability checks, `Tools.ocr` and `Tools.barcode` on iOS 26 and later, measured usage on iOS 27, and context token counts from iOS 26.4. ([#49998](https://github.com/expo/expo/pull/49998) by [@chrfalch](https://github.com/chrfalch))
- Add Android text generation and streaming with ML Kit Prompt, explicit model preparation with progress, cancellation, structured values, and application tools. ([#49999](https://github.com/expo/expo/pull/49999) by [@chrfalch](https://github.com/chrfalch))
- Add browser Prompt API support with native schema constraints, library tool orchestration, explicit model preparation, and successful session history preservation. ([#50000](https://github.com/expo/expo/pull/50000) by [@chrfalch](https://github.com/chrfalch))
- Add the initial Apple Foundation Models integration, runtime schemas, JavaScript tools, streaming, and cancellation. ([#49998](https://github.com/expo/expo/pull/49998) by [@chrfalch](https://github.com/chrfalch))
- Add one-shot generation, summarization, and categorization, typed schema helpers, plain tool definitions with ordinary data return values, optional approval and update callbacks, and opt-in deadlines. ([#49997](https://github.com/expo/expo/pull/49997) by [@chrfalch](https://github.com/chrfalch))
- Automatically select native schema and tool capabilities when supported, with library validation, bounded repairs, and tool orchestration otherwise. ([#49997](https://github.com/expo/expo/pull/49997) by [@chrfalch](https://github.com/chrfalch))

### Bug fixes

- Explain the Apple unavailability reasons instead of reporting an unrecognised cause on iOS and macOS.
- Report why a model is unavailable in plain language, keeping the provider's own reason instead of replacing it with an unmet feature requirement. ([#49997](https://github.com/expo/expo/pull/49997) by [@chrfalch](https://github.com/chrfalch))
- Keep source imports compatible with released Expo versions that do not export the event subscription type. ([#49997](https://github.com/expo/expo/pull/49997) by [@chrfalch](https://github.com/chrfalch))
- Prepare compiled output for publishing and exclude tests and local build caches from the package. ([#49997](https://github.com/expo/expo/pull/49997) by [@chrfalch](https://github.com/chrfalch))
- Keep canceled or rejected results out of retained session history on Apple, Android, and Web. ([#49997](https://github.com/expo/expo/pull/49997), [#49998](https://github.com/expo/expo/pull/49998), [#49999](https://github.com/expo/expo/pull/49999), [#50000](https://github.com/expo/expo/pull/50000) by [@chrfalch](https://github.com/chrfalch))
- Keep sessions alive while JavaScript callbacks are paused or busy without imposing an implicit deadline. ([#49997](https://github.com/expo/expo/pull/49997), [#49999](https://github.com/expo/expo/pull/49999) by [@chrfalch](https://github.com/chrfalch))
- Reject Android tasks when the app enters the background, including pending tool approval and execution. ([#49999](https://github.com/expo/expo/pull/49999) by [@chrfalch](https://github.com/chrfalch))
- Report the Android on-device model as unavailable on Android versions older than 8.0 instead of calling ML Kit, which requires API level 26. ([#49999](https://github.com/expo/expo/pull/49999) by [@chrfalch](https://github.com/chrfalch))
