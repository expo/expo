# Changelog

## 58.0.21

### Patch Changes

- [iOS] Add `JavaScriptFunction.call(argumentCount:emplacing:)` and `call(argumentCount:returning:emplacing:)` to call a JavaScript function with any `JavaScriptEncodable` arguments, and make `JavaScriptValuesBuffer.emplace(_:at:)` public. ([#52210](https://github.com/expo/expo/pull/52210) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Reduce the overhead of calling a JavaScript function that a `@JS` function received as a closure, when native code calls it on the JavaScript thread. ([#52208](https://github.com/expo/expo/pull/52208) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Reduce the overhead of `JavaScriptActor.assumeIsolated` with a throwing closure, and of blocking `JavaScriptCallback` calls on the JavaScript thread. The throwing `assumeIsolated` now throws untyped errors. ([#52210](https://github.com/expo/expo/pull/52210) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Reduce the overhead of converting Swift arrays of numbers, booleans, strings and optionals to JavaScript arrays, by encoding each element straight into the array's buffer with `JavaScriptEncodable.encode(_:into:in:)`. ([#52293](https://github.com/expo/expo/pull/52293) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `encode(_:into:in:)` to `Array` and `Dictionary`, which move the array or the object they create into the slot, and set dictionary entries with `setProperty(_:encoding:in:)`. This reduces the overhead of encoding nested arrays and dictionaries, and arrays and dictionaries in record properties. ([#52350](https://github.com/expo/expo/pull/52350) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptEncodable.encode(_:into:in:)`, which encodes a value straight into a `JavaScriptValue.Slot`. Numbers, booleans, strings and optionals construct the engine value in the slot, and `JavaScriptValuesBuffer.emplace(_:at:in:)` uses it, which reduces the overhead of passing these values as arguments to JavaScript functions. ([#52286](https://github.com/expo/expo/pull/52286) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptRuntime.HostFunctionClosure`, a host function closure that writes its result into the engine's result slot with `JavaScriptEncodable.encode(_:into:in:)` and receives the runtime as a parameter, with `createFunction` and `JavaScriptObject.setProperty(_:function:)` overloads for it. This reduces the overhead of returning numbers, booleans and strings from native functions. ([#52328](https://github.com/expo/expo/pull/52328) by [@tsapeta](https://github.com/tsapeta))
- Fix a deadlock on iOS when a JavaScript error clears the React Native scheduler queues while a task holds a promise or callback. When a promise or callback is dropped on the JavaScript thread, it now schedules the release of its state from another thread. ([#51880](https://github.com/expo/expo/pull/51880) by [@douglowder](https://github.com/douglowder))
- [iOS] Add `JavaScriptObject.setProperty(_:encoding:)`, which encodes a value in the runtime of the object with `encode(_:into:in:)` straight into the engine value that the property is set to, and `JavaScriptValue.Slot.emplace(_:)` overloads for a `JavaScriptObject` and a `JavaScriptArray`. Setting a number, a boolean or a string property this way skips the intermediate `JavaScriptValue`. ([#52346](https://github.com/expo/expo/pull/52346) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Create the standalone Hermes runtime (`JavaScriptRuntime()`) with the microtask queue and GC config of React Native's bridgeless runtime, so promise jobs go to the native microtask queue instead of running synchronously through a `setImmediate` shim. Add `JavaScriptRuntime.drainMicrotasks()`: a host of a standalone runtime calls it after each task, like React Native does. ([#52254](https://github.com/expo/expo/pull/52254) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptValue` methods that convert tuples, and the arrays, optionals and dictionaries that hold them, for the code that `expo-modules-macros` generates: `decodeTuple`, `encodeTuple`, `decodeArray`, `encodeArray`, `decodeOptional`, `encodeOptional`, `decodeDictionary` and `encodeDictionary`. An unlabeled tuple converts to an array, and a labeled tuple to an object. The encode methods write into a `JavaScriptValue.Slot`. Also add `JavaScriptObject.setProperty(_:encodingWith:)` and `JavaScriptValuesBuffer.emplace(at:encodingWith:)`, which encode a value straight into a slot of the property or the argument, `JavaScriptValue.encoding(in:_:)`, which creates a value from what is written into a slot, and `JavaScriptCallback.invokeBlocking(_:argumentCount:decoding:emplacing:)`, which decodes the result of a JavaScript function with a closure. ([#52392](https://github.com/expo/expo/pull/52392) by [@tsapeta](https://github.com/tsapeta))
- Rebuild precompiled iOS binaries against React Native 0.88.1. ([#52404](https://github.com/expo/expo/pull/52404) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 58.0.20

### Patch Changes

- [iOS] Add `JavaScriptCallback.invokeDetached(_:argumentCount:emplacing:)`, `invokeBlocking(_:argumentCount:emplacing:)` and `invokeBlocking(_:argumentCount:returning:emplacing:)`, which take the arguments as one value and a closure that encodes each one with the new `JavaScriptValuesBuffer.emplace(_:at:in:)`. `JavaScriptValuesBuffer.allocate(in:capacity:)` now fills its values with `undefined`. ([#52232](https://github.com/expo/expo/pull/52232) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Reduce the overhead of converting small `Data` values to JavaScript. ([#52164](https://github.com/expo/expo/pull/52164) by [@tsapeta](https://github.com/tsapeta))
- [Internal] Add `JavaScriptRuntime.withUnsafePointees(object:value:_:)` as `@_spi(Internal)`. It gives raw pointers to the runtime, an object and a value in one call that isn't generic, for `expo-modules-core` to emit events. ([#52178](https://github.com/expo/expo/pull/52178) by [@tsapeta](https://github.com/tsapeta))

## 58.0.19

### Patch Changes

- [iOS] Add `JavaScriptObject.tryUnsetNativeState()`, which returns `false` when the native state can't be removed, for example from a frozen object. `unsetNativeState()` now ignores that case instead of raising a C++ exception that Swift can't catch. ([#52095](https://github.com/expo/expo/pull/52095) by [@tsapeta](https://github.com/tsapeta))

## 58.0.18

### Patch Changes

- [iOS] Fix apps running out of memory when native functions return large `Data` values to JavaScript in a loop, because the garbage collector did not count the memory of the new array buffers. Also reduce the overhead of converting `Data` values to JavaScript. ([#52125](https://github.com/expo/expo/pull/52125) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Reduce the overhead of converting Swift arrays to JavaScript arrays. ([#52031](https://github.com/expo/expo/pull/52031) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add an `initializeToZero` option to `JavaScriptRuntime.createArrayBuffer(size:)`. ([#52125](https://github.com/expo/expo/pull/52125) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fix a crash in `JavaScriptObject.defineProperty` when the object doesn't accept the property, for example when it's frozen. It now uses `Reflect.defineProperty`, and the object stays unchanged. ([#52133](https://github.com/expo/expo/pull/52133) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fix a crash in `JavaScriptObject.setExternalMemoryPressure(_:)` when the runtime rejects the amount, for example an amount above 4 GB. The amount is now ignored. ([#52122](https://github.com/expo/expo/pull/52122) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Make `JavaScriptObject.takeValue()` and `JavaScriptArray.takeValue()` public. They move an object or an array into a `JavaScriptValue` without the copy that `asValue()` makes. ([#52055](https://github.com/expo/expo/pull/52055) by [@tsapeta](https://github.com/tsapeta))

## 58.0.17

### Patch Changes

- [iOS] Write the generated `jsi` module map under `EXPO_CUSTOM_BUILD_ROOT` when it is set, so a custom build writes nothing into the package directory. Without it, the module map stays at `apple/.generated/module.modulemap`. ([#51588](https://github.com/expo/expo/pull/51588) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Publish the `ExpoModulesJSI` ABI descriptor with the package, at `prebuilds/abi/ExpoModulesJSI/arm64-apple-ios-simulator.abi.json`. ([#51835](https://github.com/expo/expo/pull/51835) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Build `ExpoModulesJSI` during the Xcode build of a Swift Package Manager app, against the app's React Native. Expo source packages compile against the `ExpoModulesJSIHeaders` XCFramework that `expo-modules-jsi` ships, and the new "Build ExpoModulesJSI" build phase runs a script in `expo-modules-jsi` that builds, links and embeds the framework.

  The build phase copies the framework's dSYM to the app's dSYM folder, so archives symbolicate `ExpoModulesJSI` crashes.

  Sync fails with an error that names both versions when the `ExpoModulesJSIHeaders` XCFramework comes from another version of `expo-modules-jsi` than the installed sources.

  ([#51588](https://github.com/expo/expo/pull/51588) by [@chrfalch](https://github.com/chrfalch))

- [iOS] Add `JavaScriptObject.setProperty(_:value:)` and `JavaScriptObject.withUnownedProperty(_:_:)` overloads that take a `JavaScriptPropNameID`. `JavaScriptPropNameID.init(_:string:)` now borrows the runtime, so code that only borrows a runtime can create property names without copying it. ([#51905](https://github.com/expo/expo/pull/51905) by [@tsapeta](https://github.com/tsapeta))

## 58.0.16

### Patch Changes

- [iOS] Reduce the overhead of converting `Date` and `Data` values between JavaScript and native code, and of `JavaScriptRuntime.createObject(prototype:)`. The global functions that these conversions call are now looked up once per runtime and cached. ([#51728](https://github.com/expo/expo/pull/51728) by [@tsapeta](https://github.com/tsapeta))
- [iOS] The `dealloc` closure of `JavaScriptRuntime.createHostObject` is now `@Sendable` instead of `@JavaScriptActor`, because the engine can call it on any thread. `JavaScriptActor.assumeIsolated` no longer checks the thread name in debug builds. The check failed on reload, because Hermes runs the runtime's teardown on its finalizer thread. ([#51739](https://github.com/expo/expo/pull/51739) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Remove all `weak` references to `JavaScriptRuntime`, which makes every retain and release of the runtime faster. `JavaScriptRuntime.schedule`, `runOrSchedule` and `execute` now drop the work when the runtime is gone by the time it runs, and `execute` throws `RuntimeLostError` then. ([#51577](https://github.com/expo/expo/pull/51577) by [@tsapeta](https://github.com/tsapeta))

## 58.0.15

### Patch Changes

- [iOS] Fix native memory growth under Hermes V1 for each class created with `JavaScriptRuntime.createClass`, of about 0.57 MiB per class on React Native 0.86 and 0.87 and about 93 KiB on 0.88. `createClass` now evaluates one class factory per runtime instead of a new JavaScript source for each class, because Hermes keeps memory for every evaluated source until the runtime is destroyed. ([#51583](https://github.com/expo/expo/pull/51583) by [@amillez](https://github.com/amillez))

## 58.0.14

### Patch Changes

- [iOS] Publish a headers XCFramework for `ExpoModulesJSI` with the package, at `prebuilds/output/headers/xcframeworks/ExpoModulesJSIHeaders.tar.gz`. ([#51243](https://github.com/expo/expo/pull/51243) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Make `JavaScriptValue.getBigInt()` about 7× faster by reading the runtime through its handle, and make the `JavaScriptBigInt` initializers take the runtime as `borrowing`, so callers no longer retain it: `init(_:fromInt64:)` and `init(_:fromUint64:)` are about 3× faster. `init(_:string:)` caches the global `BigInt` function and passes the string without an arguments buffer, which makes it up to 2.3× faster; it is now isolated to `JavaScriptActor`. ([#51562](https://github.com/expo/expo/pull/51562) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Make calling a `JavaScriptCallback` with arguments faster. The arguments are encoded straight into the arguments buffer without a reference and a copy each, and the function is no longer copied on every call. ([#51565](https://github.com/expo/expo/pull/51565) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Make creating and resolving a `JavaScriptPromise` faster. Resolving no longer allocates an arguments buffer, the initializers borrow the runtime instead of retaining it, and the promise keeps its values without an extra allocation each. ([#51564](https://github.com/expo/expo/pull/51564) by [@tsapeta](https://github.com/tsapeta))
- Added `JavaScriptUndefined`, the native counterpart of JavaScript's `undefined` for `JavaScriptCodable` APIs. ([#51560](https://github.com/expo/expo/pull/51560) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `isFunction()`, `isTypedArray()`, `isArrayBuffer()`, `getTypedArray(in:)`, `getArrayBuffer(in:)`, `getBigInt(in:)` and `kind` to `JavaScriptUnownedValue`. `Data`, typed arrays, `ArrayBuffer` and integers from a `BigInt` now decode function arguments without copying them into an owning `JavaScriptValue`: a `Data` argument is about 10% faster to decode, and an `Int64` from a `BigInt` about 8× faster. ([#51558](https://github.com/expo/expo/pull/51558) by [@tsapeta](https://github.com/tsapeta))

## 58.0.13

### Patch Changes

- [iOS] Encode Swift arrays to JS arrays about 35% faster, and Swift sets to JS sets about 25% faster. ([#51496](https://github.com/expo/expo/pull/51496) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Make `JavaScriptUnownedValue` `@frozen`, so modules that decode `@JS` function arguments know its layout and no longer ask its type metadata for it. Host functions with arguments are faster, by about 8 to 12% with eight arguments. This changes the ABI of `ExpoModulesJSI`. ([#51499](https://github.com/expo/expo/pull/51499) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `createFunction` and `setProperty(_:function:)` overloads taking a `VoidFunctionClosure`, for host functions that return nothing to JavaScript. They make such calls faster because they skip creating and writing the result value. ([#51498](https://github.com/expo/expo/pull/51498) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fix the `ExpoModulesJSI` xcframework slice staying built against another Xcode's SDK. The slice cache now includes the Xcode build, so switching between Xcode releases that share a Swift compiler (such as Xcode 27.0 and 27.1) rebuilds it, and the rebuild uses the app build's `DEVELOPER_DIR` and `TOOLCHAINS` instead of the Xcode selected with `xcode-select` and the default toolchain. ([#51371](https://github.com/expo/expo/pull/51371) by [@mwolson](https://github.com/mwolson))

## 58.0.12

### Patch Changes

- [iOS] Fix a launch crash (`Symbol not found: _swift_allocateMetadataPack`) in apps that use precompiled Expo modules and build with Xcode 27. `ExpoModulesJSI` no longer exports Swift runtime symbols, so the precompiled `ExpoModulesCore` no longer depends on them. ([#51463](https://github.com/expo/expo/pull/51463) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Fix the `Build ExpoModulesJSI xcframework` build phase reporting `the following command failed with exit code 0 but produced no further output` on a cold build with Xcode 27. The package now builds with unused results (`NoUsage`) as errors, so a new one fails at the line that causes it. ([#51451](https://github.com/expo/expo/pull/51451) by [@tsapeta](https://github.com/tsapeta))

## 58.0.11

### Patch Changes

- [iOS] Conform `JavaScriptObject` and `JavaScriptArray` to `JavaScriptCodable`, so they can be `@JS` arguments and results. ([#51373](https://github.com/expo/expo/pull/51373) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptCallback`, a JavaScript function that native code can keep and call later from any thread, and `JavaScriptValue.isThenable()`. Bindings generated for `@JS` functions use `JavaScriptCallback` to pass a closure argument. ([#51037](https://github.com/expo/expo/pull/51037) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Make `JavaScriptValue` a non-copyable struct. This is a breaking change for Swift code that uses `JavaScriptValue` directly:

  - Values are moved, not shared. Pass them as `borrowing` or `consuming` parameters, and call `copy()` where a second owned value is needed.
  - `JavaScriptValue.undefined` and `JavaScriptValue.null` are functions now: write `.undefined()` and `.null()`.
  - A `JavaScriptValue` can no longer be an argument or a result of a `Function`, `AsyncFunction`, `Property` or `Field` definition. Declare the function with the `@JS` macro instead (in an `@ExpoModule` or `@SharedObject` class) and take the value as `borrowing JavaScriptValue`, or use a typed argument.
  - To keep a value in an array, an escaping closure or another place that takes copyable types only, wrap it with `value.ref()` and read it back with `take()` or `withUnwrappedValue(_:)`.
  - `JavaScriptArray.init(_:items:)`, `JavaScriptArray.enumerated()`, `JavaScriptArray.filter(_:)` and `JavaScriptValuesBuffer.copying(in:values:)` with an array of values are removed. Use the parameter pack initializer, `forEach`, `forEachIndexed`, `reduce`, or the `[JavaScriptValue.Ref]` overload.

  ([#51368](https://github.com/expo/expo/pull/51368) by [@tsapeta](https://github.com/tsapeta))

- [iOS] Add ref-based alternatives to the `JavaScriptValue` container APIs: `JavaScriptArray.forEachIndexed(_:)`, `JavaScriptPromise.resolve(_: JavaScriptValue)` and `JavaScriptValuesBuffer.copying(in:values: [JavaScriptValue.Ref])`. ([#50977](https://github.com/expo/expo/pull/50977) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Read strings from `JavaScriptValue` and `JavaScriptUnownedValue` without cloning the engine string handle, which saves a few nanoseconds on every string argument and `getString()` call. ([#51438](https://github.com/expo/expo/pull/51438) by [@tsapeta](https://github.com/tsapeta))
- [iOS] [Internal] Remove `copy runtime` where a borrowed `JavaScriptRuntime` is passed to a function, which already borrows its parameters. ([#51439](https://github.com/expo/expo/pull/51439) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Make `JavaScriptFunction`, `JavaScriptArrayBuffer`, `JavaScriptTypedArray`, `JavaScriptBigInt`, `JavaScriptWeakObject` and `JavaScriptPropNameID` hold the runtime handle instead of a weak reference to the runtime, and clone the engine value once in `JavaScriptValue.getFunction()`, `JavaScriptValue.getArrayBuffer()` and `JavaScriptFunction.asObject()`. Calling a JavaScript function from Swift is about twice as fast. ([#51435](https://github.com/expo/expo/pull/51435) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Read the properties of a typed array through property names cached per runtime, which makes `JavaScriptValue.getTypedArray()` about twice as fast. `getTypedArray()` is now isolated to `JavaScriptActor`, like `asTypedArray()`. ([#51436](https://github.com/expo/expo/pull/51436) by [@tsapeta](https://github.com/tsapeta))

## 58.0.10

### Patch Changes

- [iOS] Fix blocking `JavaScriptRuntime.execute` calls using a full CPU core while they wait for the JavaScript thread. ([#51129](https://github.com/expo/expo/pull/51129) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fix `Conformance of 'Bool' to 'JavaScriptRepresentable' is unavailable` build errors with Xcode 27.1 (Swift 6.4). Swift 6.4 printed placeholder conformances marked `@available(*, unavailable)` into the public `.swiftinterface`, and the leftover attributes attached to the next declaration. ([#51234](https://github.com/expo/expo/pull/51234) by [@tsapeta](https://github.com/tsapeta))

## 58.0.9

### Patch Changes

- [iOS] Add a `JavaScriptCodable` conformance for `Set`: it encodes to a JS `Set` and decodes from a JS `Set` or an array, collapsing duplicate elements. ([#50859](https://github.com/expo/expo/pull/50859) by [@tsapeta](https://github.com/tsapeta))
- `JavaScriptRuntime.evalAsync` now evaluates on the JavaScript thread when called from another thread on a runtime with a scheduler, instead of on the calling thread. ([#51015](https://github.com/expo/expo/pull/51015) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Speed up `JavaScriptObject.defineProperty` by looking up `Object.defineProperty` once per runtime and building the descriptor in C++. ([#51004](https://github.com/expo/expo/pull/51004) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fix the xcframework failing to build with Xcode 26 (Swift 6.2): `RuntimeScheduler` constructors annotated with `SWIFT_RETURNS_RETAINED` were rejected, and host function and host object getter callbacks failed with `sending '...' risks causing data races`. ([#51040](https://github.com/expo/expo/pull/51040) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Speed up integer arguments and results of native functions by running the integer conversions specialized inside `ExpoModulesJSI` instead of unspecialized in the calling module. A host function that adds two `Int`s runs about 7× faster. ([#51055](https://github.com/expo/expo/pull/51055) by [@tsapeta](https://github.com/tsapeta))

## 58.0.8

### Patch Changes

- [iOS] Add `decodableKinds` to `JavaScriptDecodable`: the kinds of JavaScript value (`JavaScriptValueKinds`) that `decode` can accept, so code that picks between several types can skip the ones that can't match. ([#50905](https://github.com/expo/expo/pull/50905) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fix crash reports symbolicated on the device showing no function names for `ExpoModulesJSI` frames. ([#50698](https://github.com/expo/expo/pull/50698) by [@tsapeta](https://github.com/tsapeta))
- Return strings, objects and arrays from host functions and host object getters without cloning the engine handle, and build short ASCII strings from JS inline. ([#50937](https://github.com/expo/expo/pull/50937) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptRuntime.cached(_:_:)` with typed `JavaScriptRuntime.Cache.Key`s, to create a value once per runtime and reuse it, for example a JavaScript constructor or a property name. A lookup reads one array slot, about 5× faster than the string-keyed `JavaScriptPropNameID.cached(_:_:)`. ([#50888](https://github.com/expo/expo/pull/50888) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptValue.withUnownedValue(in:_:)`, and give the owning `JavaScriptDecodable.decode` a default that borrows the value and decodes it through the `JavaScriptUnownedValue` overload, so a conformer can implement only that one. Arrays, dictionaries, dates, records and enums now decode unowned values without copying them first. ([#50960](https://github.com/expo/expo/pull/50960) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptArray.mapUnowned(_:)`, `JavaScriptObject.withUnownedProperty(_:_:)`, and `isArray()` and `getArray(in:)` on `JavaScriptUnownedValue`. Arrays, dictionaries and dates now decode through their unowned overload without copying the value or wrapping each element in a `JavaScriptValue`, and their owning decodes forward to it. ([#50980](https://github.com/expo/expo/pull/50980) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Keep checkout paths out of the Swift compilation cache key so modules importing ExpoModulesCore can reuse cached compilation results across checkouts and worktrees. ([#50354](https://github.com/expo/expo/pull/50354) by [@janicduplessis](https://github.com/janicduplessis))

## 58.0.7

### Patch Changes

- Bump precompiled artifacts due to ABI breakage in expo-modules-jsi@58.0.6. ([#50881](https://github.com/expo/expo/pull/50881) by [@kitten](https://github.com/kitten))
- [iOS] Add conversions between JavaScript values and free-form `Any`, `[Any]` and `[String: Any]` values. ([#50660](https://github.com/expo/expo/pull/50660) by [@tsapeta](https://github.com/tsapeta))

## 58.0.6

### Patch Changes

- [iOS] Read host object property names through `getPropNameIdData` instead of building a `std::string` for every access, making property access from JavaScript up to 14% faster for long names. ([#50805](https://github.com/expo/expo/pull/50805) by [@tsapeta](https://github.com/tsapeta))
- [iOS] The `JavaScriptValue`, `JavaScriptObject` and `JavaScriptArray` initializers now take the runtime as `borrowing`, so callers no longer retain it for the call, making host functions that return strings or numbers up to ~15% faster. ([#50844](https://github.com/expo/expo/pull/50844) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptValue`, `JavaScriptObject` and `JavaScriptArray` now hold a strong runtime handle instead of a `weak` reference to the runtime, which removes the weak reference traffic and slow-path reference counting from their hot paths (for example `getObject()` ~16×, `getArray()` ~12× and `getProperty(_:)` ~1.8× faster). ([#50806](https://github.com/expo/expo/pull/50806) by [@tsapeta](https://github.com/tsapeta))

## 58.0.5

### Patch Changes

- Force-bump all packages, due to migration to changesets. ([#50762](https://github.com/expo/expo/pull/50762) by [@kitten](https://github.com/kitten))

## 58.0.4 — 2026-09-25

### 🐛 Bug fixes

- [iOS] Fix the `.swiftinterface` failing to compile with Xcode 27 (Swift 6.4), because a C++ type extension was no longer stripped from it. ([#50569](https://github.com/expo/expo/pull/50569) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Fix the xcframework build phase failing iOS archives under Xcode 27. ([#50587](https://github.com/expo/expo/pull/50587) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fix the xcframework build warning about jsi headers missing from the umbrella header. ([#50588](https://github.com/expo/expo/pull/50588) by [@tsapeta](https://github.com/tsapeta))

## 58.0.3 — 2026-09-21

### 🐛 Bug fixes

- [iOS] Fix `pod install` failing when the Command Line Tools SDK is newer than the selected Xcode. ([#50316](https://github.com/expo/expo/pull/50316) by [@alanjhughes](https://github.com/alanjhughes))

## 58.0.2 — 2026-09-15

### 🎉 New features

- [iOS] Add a `JavaScriptRuntime.collectGarbage(passes:cause:until:)` overload that collects repeatedly until the given condition holds, for tests asserting on a release that a single collection doesn't always complete. ([#50188](https://github.com/expo/expo/pull/50188) by [@tsapeta](https://github.com/tsapeta))

## 58.0.1 — 2026-09-14

_This version does not introduce any user-facing changes._

## 58.0.0 — 2026-09-10

### 🛠 Breaking changes

- [iOS] `AsyncFunctionClosure` (taken by `createAsyncFunction` and the async `setProperty(_:function:)` overload) is now a synchronous closure that receives a borrowed unowned `this` and consumes the arguments buffer, matching the sync closure shape, and returns the async body of the function (`AsyncFunctionBody`). Decoding happens within the host function call, so nothing JSI-owned crosses the asynchronous boundary anymore: this removes the per-call copy of the arguments buffer and fixes a use-after-free when the runtime is reloaded while async host function calls are still queued or suspended. ([#47716](https://github.com/expo/expo/issues/47716), [#47755](https://github.com/expo/expo/pull/47755) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS] Add `JavaScriptRuntime.collectGarbage(cause:)` that requests a full garbage collection through the runtime's JSI instrumentation. It is a no-op on engines whose runtime doesn't implement GC instrumentation, unlike the Hermes-only `gc()` global that the tests used to evaluate. ([#48446](https://github.com/expo/expo/pull/48446) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptRuntime.runOrSchedule` that runs the given closure synchronously when called on the JavaScript thread and schedules it asynchronously otherwise. ([#47915](https://github.com/expo/expo/pull/47915) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add a `JavaScriptPromise.resolve` overload that takes a `JavaScriptEncodable` value, encoding it on the JavaScript thread and rejecting the promise if encoding or the resolver call throws. ([#47862](https://github.com/expo/expo/pull/47862) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add a `JavaScriptEncodable` conformance for `Task` that encodes it to a JS `Promise` settling with the task's result, so native code can hand JavaScript a promise as a value. ([#47861](https://github.com/expo/expo/pull/47861) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Split the `Array`, `Optional`, and `Dictionary` `JavaScriptCodable` conformances into separate `JavaScriptDecodable` and `JavaScriptEncodable` halves so an encode-only element type such as `Task` can be carried through a container's encode. ([#47861](https://github.com/expo/expo/pull/47861) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [iOS] Fixed the build against React Native older than 0.86 (e.g. react-native-macos 0.81), where `jsi::Runtime::getStringData` is a protected member that Swift cannot call. String decoding now goes through a C++ wrapper that uses the public `jsi::String::getStringData` helper on those versions. ([#49790](https://github.com/expo/expo/pull/49790) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fixed `dateFromMilliseconds` failing to compile with "type of expression is ambiguous" under newer toolchains: the unqualified `abs(_:)` in the `Double` overflow guard is ambiguous once C++ interop brings the C `abs` overloads into scope, so use `Double.magnitude` instead. ([#49039](https://github.com/expo/expo/pull/49039) by [@kraenhansen](https://github.com/kraenhansen))
- [iOS] Fixed `JavaScriptPropNameID(_:string:)` and the array's string-keyed subscript truncating non-ASCII property keys: they passed `String.count` (the grapheme-cluster count) as the UTF-8 byte length to `PropNameID::forUtf8`, so keys like `"café"` or `"🎉"` were built from mangled bytes and no longer matched the intended property. ([#48329](https://github.com/expo/expo/pull/48329) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fixed a use-after-free when a non-owning `JavaScriptRuntime` wrapper outlives its runtime (e.g. it is captured by a task abandoned on reload): its cached `jsi::PropNameID`s were destroyed against the freed runtime when the wrapper deallocated. The teardown sweep now flushes the cache on the JavaScript thread while the runtime is still valid. ([#47927](https://github.com/expo/expo/pull/47927) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptPromise` no longer traps when a resolve or reject call throws, which can realistically only happen against a runtime that is being torn down: a failed resolver call rejects the promise instead and a failed rejecter call is dropped. ([#47862](https://github.com/expo/expo/pull/47862) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fixed the xcframework prebuild failing under Xcode 27 due to new foreign reference ownership warnings emitted for `RuntimeScheduler` constructors. ([#49120](https://github.com/expo/expo/pull/49120) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fixed the prebuilt `ExpoModulesJSI.xcframework` shipping with code coverage instrumentation: building through the auto-generated SwiftPM scheme made Xcode pass `-profile-generate -profile-coverage-mapping` to swiftc even for a plain Release `build`, adding a counter increment to every function on the host function call path and about 40% to the binary size. The benchmark target had the same instrumentation and now runs without it. ([#49637](https://github.com/expo/expo/pull/49637) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fixed property names with non-ASCII characters being mangled when accessed by name from Swift, such as `getProperty`, `setProperty`, `hasProperty`, the array string subscript and dictionary conversions. ([#49679](https://github.com/expo/expo/pull/49679) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Fixed `JavaScriptPromise.await()` installing its `then` callbacks on the caller's thread instead of the runtime's JavaScript thread. Installing them calls into JavaScript, so an `await()` made off the JavaScript thread ran JavaScript concurrently with the thread settling the promise and could crash the engine. The install now hops through `JavaScriptRuntime.execute`, like `resolve` and `reject` already do. ([#49937](https://github.com/expo/expo/pull/49937) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [iOS] `CppError::tryCatch` now takes a C++ callable instead of an Objective-C block. Every caller already passes a pure C++ body, so the block bridged no Swift closure and only added a non-inlinable indirect call and an Objective-C runtime dependency on the JS call/eval error-handling path. ([#48333](https://github.com/expo/expo/pull/48333) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptActor.assumeIsolated` no longer heap-allocates a closure box per call by keeping its `operation` non-escaping, making synchronous host calls ~1.6× faster. ([#47837](https://github.com/expo/expo/pull/47837) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptValue.undefined` and `JavaScriptValue.null` now return shared immortal instances instead of allocating a new value on each access, removing one allocation from every void-returning host call. ([#49545](https://github.com/expo/expo/pull/49545) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Added an opt-in benchmark target that measures value access, host function calls, and JS function calls; run it with `pnpm benchmark`. ([#49579](https://github.com/expo/expo/pull/49579) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Reduced the native overhead of synchronous host function calls and host object property accessors by removing the per-call weak and unowned runtime reference traffic on the call path. ([#49631](https://github.com/expo/expo/pull/49631) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Made passing strings between JavaScript and Swift faster, up to ~3.8× for long strings. ([#49678](https://github.com/expo/expo/pull/49678) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Values returned to Swift from property reads, array reads and function calls are now taken over instead of cloned through the engine, making `toJavaScriptValue(in:)` ~1.16× faster. ([#49688](https://github.com/expo/expo/pull/49688) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Made decoding non-ASCII JS strings up to 512 UTF-16 code units long ~1.5× faster. ([#49691](https://github.com/expo/expo/pull/49691) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Made creating a deferred `JavaScriptPromise` ~1.2× faster by building it from a cached JavaScript closure instead of a host function executor. ([#49714](https://github.com/expo/expo/pull/49714) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptPromise` now installs its `then` callbacks on the first `await()` instead of at construction, making promises returned by async functions ~2.5× cheaper to create and ~3.9× cheaper to settle. ([#49718](https://github.com/expo/expo/pull/49718) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Reduced the native overhead of synchronous host function calls and host object property accessors that return `undefined`, `null`, a boolean or a number: the result is written into the engine's slot without engine calls, and errors are reported only when one was actually thrown instead of being checked on every call. ([#49761](https://github.com/expo/expo/pull/49761) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Reduced the native overhead of synchronous host function calls whose closure receives `this` as a `JavaScriptValue`, by letting the calling module destroy the arguments buffer directly. ([#49769](https://github.com/expo/expo/pull/49769) by [@tsapeta](https://github.com/tsapeta))

## 57.0.4 — 2026-07-22

### 💡 Others

- Added a script to clear local build caches and artifacts. ([#47603](https://github.com/expo/expo/pull/47603) by [@tsapeta](https://github.com/tsapeta))

## 57.0.3 — 2026-07-15

_This version does not introduce any user-facing changes._

## 57.0.2 — 2026-07-15

### 🎉 New features

- [iOS] Add `JavaScriptRef.withValue`, a non-consuming borrow accessor that reads the referenced value without taking it, so a long-lived reference can be read repeatedly. ([#47238](https://github.com/expo/expo/pull/47238) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptRuntime.longLivedObjects`, a `LongLivedObjectCollection` that keeps `LongLivedObject`s (such as in-flight promises) alive across asynchronous boundaries and releases any that remain when the runtime is torn down. ([#47511](https://github.com/expo/expo/pull/47511) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add a `JavaScriptCodable` conformance for `Date`: it encodes to a JS `Date` and decodes from a JS `Date`, a number of milliseconds since the epoch, or a string parsed by the JS engine's `Date` constructor. ([#47602](https://github.com/expo/expo/pull/47602) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [iOS] Fixed a use-after-free when a `JavaScriptPromise` outlives its runtime (e.g. an async function's promise held by a completion handler that fires after `reloadAsync()`) by having the runtime's `LongLivedObjectCollection` own its JSI values and release them on the JavaScript thread when the wrapper is dropped or at teardown, instead of against a freed runtime. ([#47521](https://github.com/expo/expo/pull/47521) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Preserve the `code` on the JavaScript error when an async function rejects with a `JavaScriptThrowable` (e.g. an `Exception`), instead of stringifying it and dropping the `code`, mirroring the synchronous throw path. ([#47259](https://github.com/expo/expo/pull/47259) by [@wwdrew](https://github.com/wwdrew))
- [iOS] Fixed a standalone `JavaScriptRuntime` leaking its underlying Hermes runtime: a runtime it creates itself is now destroyed on `deinit`, while runtimes adopted from elsewhere (e.g. React Native) are left untouched. ([#47515](https://github.com/expo/expo/pull/47515) by [@tsapeta](https://github.com/tsapeta))

## 57.0.1 — 2026-07-07

### 🐛 Bug fixes

- [iOS] Return `NSNull` instead of trapping in the deprecated `JavaScriptValue.getAny()` when it encounters a unrepresentable value. ([#47381](https://github.com/expo/expo/pull/47381) by [@alanjhughes](https://github.com/alanjhughes))

## 57.0.0 — 2026-06-25

### 🛠 Breaking changes

- [iOS] `JavaScriptError` is now a copyable class conforming to `Error` (was a non-copyable struct), and `JavaScriptValue` no longer conforms to `Error`. ([#47154](https://github.com/expo/expo/pull/47154) by [@tsapeta](https://github.com/tsapeta))

### 🎉 New features

- [iOS] `JavaScriptError` can now wrap and throw an arbitrary JS value (not only an `Error` instance) via `init(_:value:)`, preserving the thrown value's identity when it reaches JavaScript. ([#47154](https://github.com/expo/expo/pull/47154) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `createFunction`/`setProperty` overloads taking a `UnownedThisSyncFunctionClosure`, which receives `this` as a borrowed `JavaScriptUnownedValue` instead of an owning `JavaScriptValue`. Used by host functions that ignore `this` to skip the per-call owning-value allocation and its `weak`-runtime traffic. ([#46949](https://github.com/expo/expo/pull/46949) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Conform `JavaScriptRuntime` to `Identifiable` with an `id` based on the underlying runtime, equal across multiple wrappers of the same runtime. ([#47068](https://github.com/expo/expo/pull/47068) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- [iOS] Awaiting a `JavaScriptPromise` that is rejected after the await begins now throws instead of resuming with the rejection value as if fulfilled. ([#47154](https://github.com/expo/expo/pull/47154) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [iOS] Sync host functions no longer allocate a `JavaScriptRef` per call: the arguments buffer is now built inside the synchronous `assumeIsolated` closure instead of being boxed to cross the closure boundary, removing a heap allocation and its retain/release/dealloc from every host call (measured ~10% faster on the no-op `@JS` host-call floor). ([#46949](https://github.com/expo/expo/pull/46949) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptNativeState` can now back any `jsi::NativeState` subtype via a `void *` factory, so consumers without Swift/C++ interop (e.g. `expo-modules-core`) can supply their own pointee. `expo::NativeState` ships from the xcframework as a public C++ header. ([#46330](https://github.com/expo/expo/pull/46330) by [@tsapeta](https://github.com/tsapeta))
- `NativeArrayBuffer` arguments no longer copy the buffer when it's already native-backed. ([#46448](https://github.com/expo/expo/pull/46448) by [@barthap](https://github.com/barthap))
- [iOS] Type the host-object setter pointer explicitly so the nil-check conversion type-checks reliably. ([#46736](https://github.com/expo/expo/pull/46736) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptUnownedValue` and `JavaScriptValuesBuffer` now cache the runtime as the immortal `facebook.jsi.IRuntime` instead of the ARC-managed `JavaScriptRuntime` wrapper, removing per-call retain/release on the argument-decode hot path (measured ~16% faster `addNumbers`, ~24% faster `addStrings`). ([#46792](https://github.com/expo/expo/pull/46792) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `getExpoNativeState` now probes with the specialized `hasNativeState<jsi::NativeState>` and dynamic-casts the raw pointer once, avoiding a redundant `dynamic_pointer_cast` on the shared object argument unwrap hot path. ([#46712](https://github.com/expo/expo/pull/46712) by [@tsapeta](https://github.com/tsapeta))

## 56.0.10 — 2026-06-15

### 🐛 Bug fixes

- [iOS] Ignore already-settled promises. ([#46765](https://github.com/expo/expo/pull/46765) by [@jakex7](https://github.com/jakex7))

## 56.0.9 — 2026-06-10

### 🎉 New features

- [iOS] Add closure-taking `JavaScriptObject.setProperty(_:function:)` overloads that create a sync or async host function from the given closure. ([#46622](https://github.com/expo/expo/pull/46622) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Add `JavaScriptUnownedValue`, a non-owning, non-copyable value that borrows a `jsi::Value` for the zero-copy argument-decode fast path. ([#46616](https://github.com/expo/expo/pull/46616) by [@tsapeta](https://github.com/tsapeta))

## 56.0.8 — 2026-06-05

### 🐛 Bug fixes

- [iOS] Fixed `Build ExpoModulesJSI xcframework` build phase failing on Xcode 26 because the nested SwiftPM build ignored `-derivedDataPath` and wrote products outside the expected location. ([#46326](https://github.com/expo/expo/issues/46326) by [@Kurogoma4D](https://github.com/Kurogoma4D))
- [iOS] Fixed the xcframework build failing with a `sed` error when building in an environment that uses GNU `sed` instead of BSD `sed` (e.g. a Nix shell). ([#46389](https://github.com/expo/expo/pull/46389) by [@niteshbalusu11](https://github.com/niteshbalusu11))
- [iOS] Propagate `JavaScriptPromise` setup failures instead of trapping the app. ([#46106](https://github.com/expo/expo/issues/46106) by [@qutrek](https://github.com/qutrek)) ([#46145](https://github.com/expo/expo/pull/46145) by [@mvincentong](https://github.com/mvincentong))
- Fix build framework for macOS ([#46413](https://github.com/expo/expo/pull/46413) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fix build framework for Mac Catalyst ([#46289](https://github.com/expo/expo/pull/46289) by [@theeket](https://github.com/theeket))
- [iOS] Throw instead of aborting when `getPropertyAsFunction` targets a missing or non-callable property. ([#46437](https://github.com/expo/expo/pull/46437) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Throw instead of aborting when `getPropertyAsObject` targets a non-object property. ([#46438](https://github.com/expo/expo/pull/46438) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Include the Swift toolchain version in the xcframework cache key so upgrading Xcode rebuilds slices instead of reusing ones built by an older compiler. ([#46523](https://github.com/expo/expo/pull/46523) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Clear stale build intermediates before rebuilding xcframework slices to avoid compiler errors. ([#46399](https://github.com/expo/expo/pull/46399) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Type the host-object setter pointer explicitly so the nil-check conversion type-checks reliably. ([#46736](https://github.com/expo/expo/pull/46736) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Awaiting a `JavaScriptPromise` that is rejected after the await begins now throws instead of resuming with the rejection value as if fulfilled. ([#47154](https://github.com/expo/expo/pull/47154) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Preserve the `code` on the JavaScript error when an async function rejects with a `JavaScriptThrowable` (e.g. an `Exception`), instead of stringifying it and dropping the `code` — mirroring the synchronous throw path. ([#47259](https://github.com/expo/expo/pull/47259) by [@wwdrew](https://github.com/wwdrew))
- [iOS] Return `NSNull` instead of trapping in the deprecated `JavaScriptValue.getAny()` when it encounters a unrepresentable value. ([#47381](https://github.com/expo/expo/pull/47381) by [@alanjhughes](https://github.com/alanjhughes))
- [iOS] Fixed the `Build ExpoModulesJSI xcframework` build phase intermittently failing on Xcode 27 when clearing stale build state raced Xcode's background indexer writing into the SwiftPM index store. ([#47914](https://github.com/expo/expo/pull/47914) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [iOS] Sync host functions no longer allocate a `JavaScriptRef` per call: the arguments buffer is now built inside the synchronous `assumeIsolated` closure instead of being boxed to cross the closure boundary, removing a heap allocation and its retain/release/dealloc from every host call (measured ~10% faster on the no-op `@JS` host-call floor). ([#46949](https://github.com/expo/expo/pull/46949) by [@tsapeta](https://github.com/tsapeta))
- [iOS] `JavaScriptUnownedValue` and `JavaScriptValuesBuffer` now cache the runtime as the immortal `facebook.jsi.IRuntime` instead of the ARC-managed `JavaScriptRuntime` wrapper, removing per-call retain/release on the argument-decode hot path (measured ~16% faster `addNumbers`, ~24% faster `addStrings`). ([#46678](https://github.com/expo/expo/pull/46678) by [@tsapeta](https://github.com/tsapeta))
- `NativeArrayBuffer` arguments no longer copy the buffer when it's already native-backed. ([#46448](https://github.com/expo/expo/pull/46448) by [@barthap](https://github.com/barthap))
- [iOS] `JavaScriptNativeState` can now back any `jsi::NativeState` subtype via a `void *` factory, so consumers without Swift/C++ interop (e.g. `expo-modules-core`) can supply their own pointee. `expo::NativeState` ships from the xcframework as a public C++ header. ([#46330](https://github.com/expo/expo/pull/46330) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Ignore already-settled promises. ([#46765](https://github.com/expo/expo/pull/46765) by [@jakex7](https://github.com/jakex7))
- [iOS] `getExpoNativeState` now probes with the specialized `hasNativeState<jsi::NativeState>` and dynamic-casts the raw pointer once, avoiding a redundant `dynamic_pointer_cast` on the shared object argument unwrap hot path. ([#46712](https://github.com/expo/expo/pull/46712) by [@tsapeta](https://github.com/tsapeta))

## 56.0.7 — 2026-05-20

### 🐛 Bug fixes

- [iOS] Implement converters for `JavaScriptRepresentable` to prevent crashes on iOS 17 and 16. ([#45950](https://github.com/expo/expo/pull/45950) by [@behenate](https://github.com/behenate))

### 💡 Others

## 56.0.6 — 2026-05-19

### 🐛 Bug fixes

- [iOS] Fixed `no such module 'jsi'` build error when the package path contains `=` (pnpm virtual store with patched dependencies). ([#45956](https://github.com/expo/expo/pull/45956) by [@tsapeta](https://github.com/tsapeta))

## 56.0.5 — 2026-05-15

_This version does not introduce any user-facing changes._

## 56.0.4 — 2026-05-13

### 🐛 Bug fixes

- [iOS] Fixed xcframework build cache not invalidating when React-jsi headers change. ([#45735](https://github.com/expo/expo/pull/45735) by [@tsapeta](https://github.com/tsapeta))
- [iOS] Added support for `facebook::jsi::IRuntime` so the package builds against React Native 0.86+, while staying compatible with 0.85 and react-native-tvos. ([#45728](https://github.com/expo/expo/pull/45728) by [@zoontek](https://github.com/zoontek))

## 56.0.3 — 2026-05-11

### 🐛 Bug fixes

- [iOS] Fixed launch-time crash in apps with source-built React Native. ([#45636](https://github.com/expo/expo/pull/45636) by [@tsapeta](https://github.com/tsapeta))

## 56.0.2 — 2026-05-08

### 🐛 Bug fixes

- [iOS] Fixed `ExpoModulesJSI.xcframework` build failing under `useFrameworks: "static"` + `buildReactNativeFromSource: true` due to missing header search paths. ([#45508](https://github.com/expo/expo/pull/45508) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Fixed missing slices in `ExpoModulesJSI.xcframework` causing `No such module 'ExpoModulesJSI'` build errors. ([#45542](https://github.com/expo/expo/pull/45542) by [@tsapeta](https://github.com/tsapeta))

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🎉 New features

- [iOS] Added `JavaScriptValuesBuffer.copying(in:values:)` and `rawBaseAddress` for forwarding pre-converted JS values across the Swift/ObjC++ boundary. ([#45257](https://github.com/expo/expo/pull/45257) by [@alanjhughes](https://github.com/alanjhughes))

### 🐛 Bug fixes

- [iOS] Added prebuild configuration for `ExpoModulesJSI` to be built with precompiled XCFrameworks. ([#45124](https://github.com/expo/expo/pull/45124) by [@chrfalch](https://github.com/chrfalch))
