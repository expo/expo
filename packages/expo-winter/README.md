# expo-winter

Native [WinterCG](https://wintercg.org/work)-compliant runtime for Expo apps. This project is currently focused at enabling the ["Common Minimum API"](https://common-min-api.proposal.wintercg.org/) and ["Fetch"](https://fetch.spec.wintercg.org/) specifications.

| API                                | iOS | Android | Web | Server |
| ---------------------------------- | --- | ------- | --- | ------ |
| `AbortController`                  | ❌  | ❌      | ✅  | ✅     |
| `AbortSignal`                      | ❌  | ❌      | ✅  | ✅     |
| `Blob`                             | ❌  | ❌      | ✅  | ✅     |
| `ByteLengthQueuingStrategy`        | ❌  | ❌      | ✅  | ✅     |
| `CompressionStream`                | ❌  | ❌      | ✅  | ✅     |
| `CountQueuingStrategy`             | ❌  | ❌      | ✅  | ✅     |
| `Crypto`                           | ❌  | ❌      | ✅  | ✅     |
| `CryptoKey`                        | ❌  | ❌      | ✅  | ✅     |
| `DecompressionStream`              | ❌  | ❌      | ✅  | ✅     |
| `DOMException`                     | ❌  | ❌      | ✅  | ✅     |
| `Event`                            | ❌  | ❌      | ✅  | ✅     |
| `EventTarget`                      | ❌  | ❌      | ✅  | ✅     |
| `File`                             | ❌  | ❌      | ✅  | ✅     |
| `FormData`                         | ❌  | ❌      | ✅  | ✅     |
| `Headers`                          | ✅  | ❌      | ✅  | ✅     |
| `ReadableByteStreamController`     | ❌  | ❌      | ✅  | ✅     |
| `ReadableStream`                   | ✅  | ❌      | ✅  | ✅     |
| `ReadableStreamBYOBReader`         | ❌  | ❌      | ✅  | ✅     |
| `ReadableStreamBYOBRequest`        | ❌  | ❌      | ✅  | ✅     |
| `ReadableStreamDefaultController`  | ❌  | ❌      | ✅  | ✅     |
| `ReadableStreamDefaultReader`      | ❌  | ❌      | ✅  | ✅     |
| `Request`                          | ✅  | ❌      | ✅  | ✅     |
| `Response`                         | ✅  | ❌      | ✅  | ✅     |
| `SubtleCrypto`                     | ❌  | ❌      | ✅  | ✅     |
| `TextDecoder`                      | ✅  | ❌      | ✅  | ✅     |
| `TextDecoderStream`                | ❌  | ❌      | ✅  | ✅     |
| `TextEncoder`                      | ✅  | ❌      | ✅  | ✅     |
| `TextEncoderStream`                | ❌  | ❌      | ✅  | ✅     |
| `TransformStream`                  | ❌  | ❌      | ✅  | ✅     |
| `TransformStreamDefaultController` | ❌  | ❌      | ✅  | ✅     |
| `URL`                              | ✅  | ❌      | ✅  | ✅     |
| `URLSearchParams`                  | ✅  | ❌      | ✅  | ✅     |
| `WebAssembly.Global`               | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.Instance`             | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.Memory`               | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.Module`               | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.Table`                | ❌  | ❌      | ✅  | ✅     |
| `WritableStream`                   | ❌  | ❌      | ✅  | ✅     |
| `WritableStreamDefaultController`  | ❌  | ❌      | ✅  | ✅     |

| Global Methods                     | iOS | Android | Web | Server |
| ---------------------------------- | --- | ------- | --- | ------ |
| `atob`                             | ✅  | ❌      | ✅  | ✅     |
| `btoa`                             | ✅  | ❌      | ✅  | ✅     |
| `fetch`                            | ✅  | ✅      | ✅  | ✅     |
| `console`                          | ✅  | ✅      | ✅  | ✅     |
| `setTimeout`                       | ✅  | ✅      | ✅  | ✅     |
| `clearTimeout`                     | ✅  | ✅      | ✅  | ✅     |
| `setInterval`                      | ✅  | ✅      | ✅  | ✅     |
| `clearInterval`                    | ✅  | ✅      | ✅  | ✅     |
| `queueMicrotask`                   | ✅  | ✅      | ✅  | ✅     |
| `navigator.userAgent`              | ❌  | ❌      | ✅  | ✅     |
| `crypto`                           | ❌  | ❌      | ✅  | ✅     |
| `structuredClone`                  | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.compile`              | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.compileStreaming`     | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.instantiate`          | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.instantiateStreaming` | ❌  | ❌      | ✅  | ✅     |
| `WebAssembly.validate`             | ❌  | ❌      | ✅  | ✅     |

## About

Expo WinterCG works similar to Node.js, installing precompiled built-ins via native code rather than the traditional approach of bundling them with the JavaScript bundle. This allows for a smaller bundle size and faster startup time.

WinterCG compliance on native is designed to provide a solid interface for apps that require advanced networking capabilities.
