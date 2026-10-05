# expo-ai

An experimental Expo module for system-provided on-device language models. The current private preview supports Apple Foundation Models, Gemini Nano through Android's ML Kit Prompt API, and compatible desktop browsers through the Prompt API for one-shot text generation, summarization, categorization, structured values, and application tools.

The package automatically uses native schema constraints and tool orchestration when supported. Otherwise, it validates generated data and manages tools with bounded model calls and repair attempts. Every successful structured result passes validation. Native failures and refusals do not trigger a weaker fallback, and tool handlers are never automatically retried.

Android model readiness depends on the device and AICore. Android tasks reject with `ERR_APP_BACKGROUND` if the app leaves the foreground, including while waiting for tool approval. Android and Web provide explicit model preparation with optional progress. Browser preparation must start from a user action; browser-managed asset downloads cannot be completely prevented by the adapter.

Explicit sessions are available when tasks need history. Generation updates, cancellation, and deadlines are optional, and the library imposes no deadline by default. Web requires a compatible desktop browser exposing the modern `LanguageModel` API.

Apple image tools are available through `import { Tools } from 'expo-ai/apple'`. Pass `Tools.ocr` or `Tools.barcode` with labeled local images on iOS 26 and later. General image understanding requires iOS 27, a build with Xcode 27, and a system model with vision support. Measured token usage requires iOS 27 and a build with Xcode 27; completed context counts are available from iOS 26.4. The same version boundaries apply to macOS. Third-party model backends are not included.

For Android apps using Prebuild, install `expo-build-properties` and configure `android.minSdkVersion` to 26 and `android.kotlinVersion` to 2.2.21 or a higher compatible version. This private preview also requires the corrected Android template from this checkout so the compiler uses that setting; see the SDK installation instructions below. Native projects that do not use Prebuild need the equivalent Gradle configuration.

See the [SDK documentation](../../docs/pages/versions/unversioned/sdk/ai.mdx) for local archive installation, native build configuration, examples, supported schemas, and API documentation. This package is unpublished. Native apps require a development build; the package is not included in Expo Go.
