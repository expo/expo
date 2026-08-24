# Issue #49111 investigation handover

Issue: [expo/expo#49111](https://github.com/expo/expo/issues/49111)  
Reproduction: [sebestyn/expo-multipart-windows-repro](https://github.com/sebestyn/expo-multipart-windows-repro) (locally at `~/git/sebestyn/expo-multipart-windows-repro`)

## References

- Expo report: [expo/expo#49111 — Large Metro multipart bundle fails in `BundleDownloader` with invalid HTTP chunk size](https://github.com/expo/expo/issues/49111)
- Reproduction repository: [sebestyn/expo-multipart-windows-repro](https://github.com/sebestyn/expo-multipart-windows-repro)
- Exact reproduction revision tested: [`2c860f2`](https://github.com/sebestyn/expo-multipart-windows-repro/commit/2c860f2be8f2c19619c604227aad919e0e51d555)
- Reproduction tooling:
  - [30 MiB payload generator](https://github.com/sebestyn/expo-multipart-windows-repro/blob/2c860f2be8f2c19619c604227aad919e0e51d555/scripts/generate-large-module.mjs)
  - [Raw HTTP response validator](https://github.com/sebestyn/expo-multipart-windows-repro/blob/2c860f2be8f2c19619c604227aad919e0e51d555/scripts/verify-response.mjs)
  - [Reproduction instructions and controls](https://github.com/sebestyn/expo-multipart-windows-repro/blob/2c860f2be8f2c19619c604227aad919e0e51d555/README.md)
- React Native memory-pressure report: [react-native#52818 — `BundleDownloader` OOM on Android](https://github.com/facebook/react-native/issues/52818)
- React Native fix PR: [react-native#54854 — Eliminate intermediate multipart buffer copies](https://github.com/facebook/react-native/pull/54854)
- React Native fix commit: [`57eb56f`](https://github.com/facebook/react-native/commit/57eb56fbf5658170026b82bba04358e58237eb70)
- Release-branch implementations:
  - [RN 0.86 `MultipartStreamReader.kt` before the fix](https://github.com/facebook/react-native/blob/0.86-stable/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/devsupport/MultipartStreamReader.kt)
  - [RN 0.87 `MultipartStreamReader.kt` with the fix](https://github.com/facebook/react-native/blob/0.87-stable/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/devsupport/MultipartStreamReader.kt)
  - [RN 0.86 `BundleDownloader.kt`](https://github.com/facebook/react-native/blob/0.86-stable/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/devsupport/BundleDownloader.kt)
- Metro response implementation:
  - [Metro 0.84.4 `MultipartResponse.js`](https://github.com/facebook/metro/blob/v0.84.4/packages/metro/src/Server/MultipartResponse.js)
  - [Metro 0.84.4 progress-response call site](https://github.com/facebook/metro/blob/v0.84.4/packages/metro/src/Server.js)
- Relevant Node implementation and Windows evidence:
  - [Node 24.12.0 HTTP outgoing-message implementation](https://github.com/nodejs/node/blob/v24.12.0/lib/_http_outgoing.js)
  - [nodejs/node#63620 — separate Windows TCP/libuv regression in Node 24.0–24.15](https://github.com/nodejs/node/issues/63620)
- Client HTTP decoder:
  - [OkHttp 4.9.2 `Http1ExchangeCodec.kt`](https://github.com/square/okhttp/blob/parent-4.9.2/okhttp/src/main/kotlin/okhttp3/internal/http1/Http1ExchangeCodec.kt)

No persistent changes were made to the reproduction during this investigation. The validator instrumentation and 64 KiB Metro write-splitting experiment described below were temporary local changes and were reverted, so there is no change commit or PR to link. The links above point to the exact reproduction revision and files that were exercised.

## Summary

The reported `java.net.ProtocolException` could not be reproduced on macOS arm64, including with payloads up to 120 MiB. The investigation did confirm that Expo SDK 57 / React Native 0.86.2 contains React Native's old memory-heavy Android multipart reader. The fix in React Native commit [`57eb56f`](https://github.com/facebook/react-native/commit/57eb56fbf5658170026b82bba04358e58237eb70) is absent from `0.86-stable` and present in `0.87-stable`.

The strongest lead for the exact exception is the shape of Metro's HTTP response: Metro sends the complete 35,669,885-byte JavaScript bundle with one `res.write(data)` call. Node encodes that as one 35.7 MB HTTP transfer chunk. Metro also ignores `res.write()` backpressure. A slow, memory-heavy RN 0.86 client combined with Windows Node/libuv or the Windows Android-emulator network path may corrupt or expose corruption in that very large framed write.

The upstream RN fix is relevant and likely worth backporting, but it cannot directly repair malformed HTTP transfer framing because OkHttp decodes transfer chunks before `MultipartStreamReader` receives the body.

## Environment tested

- Host: macOS arm64
- Reproduction: Expo 57.0.14, bundled `@expo/cli` 57.0.16, Metro 0.84.4, React Native 0.86.2
- Node: 24.18.1 through Nix; Node 22.23.2 was also used for host validation
- Android: API 35 arm64 emulator
- Generated payloads: 30 MiB, 60 MiB, and 120 MiB

The reporter used Windows 11, Node 24.12.0, and an API 35 x86_64 emulator. Those exact host and emulator conditions have not yet been tested.

## Reporter observations and controls

These facts come from the original report and should be preserved when comparing any new run:

- A generated 1 MiB payload succeeds and logs `Running "main"`.
- A generated 30 MiB payload fails consistently on the reporter's setup.
- Metro completes bundling, but the development client remains on a white screen.
- The resulting development response is approximately 36.2 MB.
- The invalid byte in OkHttp's chunk-size exception varies; `0x0d` is one observed value.
- The failure is in an Android development build using Expo 57.0.14 and RN 0.86.2.
- The host-side multipart validator accepts the complete raw chunked response.
- Requesting the same bundle as `application/javascript` succeeds with the expected `Content-Length` and is an effective workaround.
- The reporter used pnpm 10.34.5.

The Windows label remains a correlation, not a demonstrated root cause. No cross-platform comparison was included in the report.

## Confirmed findings

### React Native release boundary

Official React Native branch ancestry and source were checked directly:

- `0.86-stable` does not contain `57eb56f` and still passes an unbounded `okio.Buffer` to `onChunkComplete`.
- `0.87-stable` contains `57eb56f` and uses a bounded `BufferedSource`/`FixedLengthSource` implementation.
- Expo's SDK 57 reproduction is therefore affected by the old buffering behavior.

The related upstream work is [react-native#54854](https://github.com/facebook/react-native/pull/54854), which addresses Android memory use during large multipart bundle downloads.

### Local Android results

The unmodified RN 0.86.2 development build successfully downloaded and ran every tested payload:

| Generated payload | Result | Approximate process RSS |
| --- | --- | ---: |
| 30 MiB | Loaded; `Running "main"` logged | 473 MiB |
| 60 MiB | Loaded; `Running "main"` logged | 582 MiB |
| 120 MiB | Loaded; `Running "main"` logged | 888 MiB |

At 30 MiB the UI displayed `Generated payload: 31,457,280 characters`. No `ProtocolException`, `OutOfMemoryError`, downloader error, or white screen occurred.

The memory growth strongly validates the motivation for the RN 0.87 fix, even though this machine had enough memory to complete the downloads.

### HTTP response validation

Both multipart and regular JavaScript responses validated locally. Node 24 on macOS also produced valid framing under client-side backpressure.

The regular JavaScript response had `Content-Length: 35669885`, matching the complete 35,669,885-byte body. The multipart response used `Transfer-Encoding: chunked` because progress parts are written before the final bundle size is available.

The reproduction's existing validator proved useful but has an important limitation: a request made after bundling may exercise a cached response rather than the first response that remains open while Metro emits progress events.

It also does not make the same request as OkHttp:

- It connects to `127.0.0.1`, bypassing the emulator and Windows LAN/NAT path.
- It explicitly sends `Connection: close`; OkHttp normally uses persistent pooled connections.
- It does not reproduce OkHttp's full request headers, including its user agent and automatic content-encoding negotiation.
- It opens a new connection rather than potentially reusing one previously used by the development client.

Consequently, a successful validator proves that Node can produce one valid response for that host-side connection. It does not prove that the device received identical bytes or exercised identical connection state.

Cold and cached responses were therefore inspected separately.

### Metro's transfer-chunk shape

Metro 0.84.4's `MultipartResponse.writeChunk()` performs separate `res.write()` calls for the boundary, headers, data, and closing boundary. For the final bundle, `data` is the complete bundle string.

Observed raw HTTP transfer chunks for the 30 MiB reproduction:

- One representative cold response: 1,023 chunks total. The exact count varies with the number and timing of progress writes.
- Cached response: 6 chunks total.
- In both cases, one chunk was exactly 35,669,885 bytes (`0x220477d`).
- The other chunks were small progress events, multipart headers, and boundaries.

Metro does not inspect the boolean return value from `res.write()`, so it does not wait for drain/backpressure before continuing to queue writes. During progress reporting it also calls `socket.uncork()`, encouraging queued progress output to be flushed while the build is active.

A temporary local experiment split large string data into 64 KiB `res.write()` calls:

- Cached response changed from 6 transfer chunks to 550 transfer chunks.
- Cold response changed from roughly 1,023 to 1,504 transfer chunks.
- The resulting raw response remained valid.

That experiment was reverted. It is not yet known whether splitting the write fixes the Windows failure.

## Interpretation of the exact exception

The reported stack begins in:

```text
okhttp3.internal.http1.Http1ExchangeCodec$ChunkedSource.readChunkSize
okhttp3.internal.http1.Http1ExchangeCodec$ChunkedSource.read
okio.RealBufferedSource.read
com.facebook.react.devsupport.MultipartStreamReader.readAllParts
```

OkHttp reports `Expected leading [0-9a-fA-F] character but was 0xd` when it expects the first hexadecimal digit of the next HTTP chunk-size line but encounters a carriage return. The invalid byte reportedly varies.

Plausible wire-level causes include:

- An extra CRLF between HTTP chunks.
- A previous chunk declaring too few bytes.
- A missing or truncated next chunk-size line.
- Bytes being duplicated, omitted, or otherwise misaligned below OkHttp's parser.

This is below multipart parsing. A multipart boundary cannot normally be mistaken for an HTTP chunk size because OkHttp strips the transfer encoding before RN's `MultipartStreamReader` sees the body.

The RN reader can still be an indirect trigger: its high memory consumption and GC/allocation pauses make the client slower, increasing server-side queued data and pressure on the intermediary network path.

The old reader also contains a suspicious extra `source.read(content, indexOfHeaders)` after finding multipart headers; the RN 0.87 rewrite removes it. This contributes to the case for backporting the reader, but it still operates above OkHttp's HTTP transfer decoder and cannot directly manufacture an invalid chunk-size line.

## Evidence against simpler explanations

- Payload size alone is insufficient: the unpatched macOS/arm64 client loaded 30, 60, and 120 MiB payloads.
- Node 24 alone is insufficient: Node 24.18.1 on macOS produced valid cold and cached multipart responses.
- RN 0.86's old reader alone is insufficient: the exact reader and resolved Android dependencies succeeded locally, although with extreme memory use.
- Metro does not deterministically emit invalid framing for every client: multiple complete raw responses validated.
- A multipart-boundary parsing mistake does not match the exception layer; the failure is in OkHttp's lower HTTP/1.1 chunk decoder.
- The host validator does not rule out a server problem that depends on backpressure, connection reuse, request headers, Node 24.12.0, or Windows-specific socket behavior.

## Ranked hypotheses

### 1. Windows Node/libuv handling of one very large framed write

Node 24.12.0 on Windows must send a single 35.7 MB logical HTTP chunk consisting of a hexadecimal size line, the payload, and a trailing CRLF. A Windows-specific partial-write or vectored-write problem under backpressure could leave the stream misframed.

The varying invalid byte is consistent with general stream misalignment rather than a deterministic multipart parsing mistake. This remains unproven.

Node 24.0 through 24.15 also had at least one separate confirmed Windows TCP/libuv regression, [nodejs/node#63620](https://github.com/nodejs/node/issues/63620). That issue concerns outbound connection setup and does not directly explain this server-write failure, but it makes comparison with newer Node 24 and Node 22 worthwhile.

### 2. Windows Android-emulator networking/NAT

The host validator connects directly to the Windows Node process. The Android app's request traverses the emulator's virtual network and Windows NAT/filtering path. Consequently, a successful host validator does not prove that the byte stream delivered to the emulator is identical.

This is currently the strongest explanation for the reported Windows association. Testing through `adb reverse` is the most valuable discriminator.

### 3. Persistent-connection or request-shape interaction

The validator forces a fresh `Connection: close` loopback request, while OkHttp normally pools HTTP/1.1 connections and may reuse a connection after other development-server traffic. A stale/reused connection, different `Accept-Encoding`, or another request-header-dependent middleware path could help explain why the validator succeeds while the app fails.

There is no direct evidence yet that connection reuse is responsible. It is important because the existing validator is not an equivalent client control.

### 4. RN 0.86 buffering and memory pressure as a trigger

RN 0.86 retains the multipart content in memory and causes very high process RSS. Pauses or allocation pressure may make the transport problem reproducible at 30 MiB on the reporter's x86_64 emulator while the arm64 macOS emulator succeeds even at larger sizes.

Applying `57eb56f` could make the exception disappear by changing memory use and read timing. Such a result would not prove that RN generated the malformed transfer framing.

### 5. OkHttp/Okio dependency skew

The Android dependency graph resolves:

- OkHttp 4.9.2
- Okio 3.16.0

React Native declares Okio 2.9.0, but another dependency upgrades it to 3.16.0. RN's multipart source includes a suppression for conflicting Okio versions. The same resolved versions succeeded locally, so this is unlikely to be sufficient by itself, but an x86_64- or pressure-specific interaction has not been eliminated.

### 6. Host networking filters

VPN software, antivirus inspection, firewall filters, or unusual Windows network drivers could affect the emulator/LAN path while leaving a loopback host validator unaffected.

## Recommended next experiments

Run these on a Windows 11 x64 machine with an API 35 x86_64 emulator, changing one variable at a time.

1. **Node version matrix**
   - Exact reporter version: Node 24.12.0.
   - Current Node 24.x.
   - Current Node 22.x.

2. **Bypass emulator LAN/NAT**
   - Run `adb reverse tcp:8084 tcp:8084`.
   - Ensure the development client requests `localhost:8084` through the reversed port.
   - Compare against the normal LAN address.

3. **Make the host control request equivalent**
   - Capture the complete OkHttp request headers at Metro.
   - Extend the raw validator to reproduce those headers.
   - Test both `Connection: close` and a reused keep-alive socket.
   - On one persistent socket, request another development endpoint before requesting the bundle.
   - Test loopback, the host's LAN address, and the emulator path separately.

4. **Split Metro's final response write**
   - Temporarily change `MultipartResponse.writeChunk()` so large data is emitted in moderate pieces, preferably with proper asynchronous drain handling.
   - A quick ASCII-only diagnostic can use 64 KiB string slices, but a real fix must preserve UTF-8 correctly and respect backpressure.
   - If this alone fixes the failure, investigate Node/libuv and emulator handling of the original 35.7 MB transfer chunk.

5. **Apply the RN 0.87 multipart fix independently**
   - Backport `57eb56f` to RN 0.86.2 or test an RN 0.87-based build.
   - Record both success/failure and process memory.

6. **Physical-device control**
   - Use a physical Android device over `adb reverse` and over LAN if possible.

7. **Capture the actual failing stream**
   - Capture on Windows using Wireshark/Npcap.
   - Capture inside the emulator using `adb shell tcpdump` if the image allows it.
   - Identify the last valid chunk, its declared size, the actual number of bytes delivered, and the bytes immediately before the invalid character.

8. **Cold versus cached request**
   - Clear Metro's cache and capture the first device request.
   - Then retry the same URL against the cached graph.
   - Do not treat a post-failure host validator alone as equivalent to the device's original request.

9. **Regular JavaScript control**
   - Confirm `Accept: application/javascript` still succeeds from the same device and connection path.
   - This separates transfer-chunk framing from general large-body delivery.

10. **Remove host filters**
   - Temporarily disable VPNs and third-party network/HTTP inspection where safe.

## Suggested observation points

- Use `pnpx 2g ps --active` to find the active Expo CLI session.
- Use `pnpx 2g tap "expo" --tail --debug` while reproducing, narrowing the filter once relevant event names are known.
- Capture Logcat for `BundleDownloader`, `MultipartStreamReader`, `ProtocolException`, `OutOfMemoryError`, and `ReactNativeJS`.
- Record Metro's request headers, `res.write()` byte lengths and return values, socket `writableLength`, and `drain` events.
- Record whether the bundle response is cold or cached and whether its connection is new or reused.
- If packet capture is available, compare the chunk-size line and payload length at the Windows Node socket with the corresponding bytes delivered inside the emulator.

The key fact to establish is the first point at which the byte stream differs: Node's logical writes, the Windows host packet stream, the emulator guest packet stream, or OkHttp's buffered source.

## Tooling needed to close the investigation

The missing environment is a Windows 11 x64 host or VM capable of hardware-accelerated Android emulation, with:

- Node 24.12.0, latest Node 24, and Node 22
- Android API 35 x86_64 AVD
- `adb reverse`
- Wireshark/Npcap
- Ideally a physical Android device

The macOS arm64 environment is useful for tracing and controls but has not reproduced the exact exception through 120 MiB.

## Workspace state

- All temporary Metro and validator instrumentation was reverted.
- The reproduction's ignored `large-module.js` was restored to 30 MiB.
- Metro and the Android emulator were stopped.
- No tracked files in the reproduction were changed.
