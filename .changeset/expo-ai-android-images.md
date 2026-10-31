---
'expo-ai': minor
---

Add image input on Android. The package sends labeled local images to Gemini Nano after the prompt text. ML Kit does not report whether the device model accepts images, so Android reports the `images` capability as `unknown`. A text-only device model rejects the request with `ERR_UNSUPPORTED_FEATURE`.
