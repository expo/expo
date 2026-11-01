---
'expo-ai': minor
---

Add image input on Android. The package sends local images to Gemini Nano after the prompt text, each with its label. ML Kit does not report whether the device model accepts images, so Android reports the `images` capability as `unknown`. A device model that does not accept images can reject the request, for example with `ERR_UNSUPPORTED_FEATURE`, or can ignore the images.
