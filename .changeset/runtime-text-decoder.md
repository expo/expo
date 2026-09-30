---
'expo': patch
---

Remove the UTF-8-only `TextDecoder` polyfill and use the runtime implementation provided by Hermes in React Native 0.88, preserving support for legacy encodings such as Latin-1. Custom JavaScript runtimes must provide `TextDecoder` before initializing Expo.
