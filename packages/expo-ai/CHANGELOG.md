# Changelog

## Unpublished

### New features

- Add inclusive `minimum` and `maximum` schema bounds for numbers and integers, using native generation guides on Apple and library validation with bounded repairs on Android and Web.
- Document the Android minimum SDK and Kotlin compiler settings with `expo-build-properties`.
- Add Apple image input with native vision capability checks, `Tools.ocr` and `Tools.barcode` on iOS 26 and later, measured usage on iOS 27, and context token counts from iOS 26.4.
- Add Android text generation and streaming with ML Kit Prompt, explicit model preparation with progress, cancellation, structured values, and application tools.
- Add browser Prompt API support with native schema constraints, library tool orchestration, explicit model preparation, and successful session history preservation.
- Add the initial Apple Foundation Models integration, runtime schemas, JavaScript tools, streaming, and cancellation.
- Add one-shot generation, summarization, and categorization, typed schema helpers, plain tool definitions with ordinary data return values, optional approval and update callbacks, and opt-in deadlines.
- Automatically select native schema and tool capabilities when supported, with library validation, bounded repairs, and tool orchestration otherwise.

### Bug fixes

- Keep source imports compatible with released Expo versions that do not export the event subscription type.
- Prepare compiled output for publishing and exclude tests and local build caches from the package.
- Keep canceled or rejected results out of retained session history on Apple, Android, and Web.
- Keep sessions alive while JavaScript callbacks are paused or busy without imposing an implicit deadline.
- Reject Android tasks when the app enters the background, including pending tool approval and execution.
