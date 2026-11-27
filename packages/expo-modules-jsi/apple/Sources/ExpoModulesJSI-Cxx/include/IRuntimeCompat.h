#pragma once
#ifdef __cplusplus

#include <jsi/jsi.h>

// React Native 0.86 split the JSI API into the abstract `jsi::IRuntime` base
// and the concrete `jsi::Runtime` derived class — most value/object/function
// methods now take `IRuntime&` instead of `Runtime&`. Older React Native
// versions (e.g. react-native-tvos 0.85) only have `jsi::Runtime`. Alias
// `IRuntime` to `Runtime` there so the same source compiles against both.
//
// Since React Native 0.89 the `cxxreact` header emits a `#warning`, and a
// warning fails the Xcode 27 build, so prefer the `react/utils` header.
#if __has_include(<react/utils/ReactNativeVersion.h>)
#include <react/utils/ReactNativeVersion.h>
#elif __has_include(<cxxreact/ReactNativeVersion.h>)
#include <cxxreact/ReactNativeVersion.h>
#endif

// React Native 0.86 added native `TypedArray` / `Uint8Array` predicates and accessors on
// `jsi::IRuntime`. Hermes V1 overrides these directly; engines that keep `jsi::Runtime`'s default
// implementations (such as legacy Hermes with `RCT_HERMES_V1_ENABLED=0` or JSC) run JS fallbacks
// that may throw `jsi::JSIException`, so callers catch `jsi::JSIException`.
#if defined(REACT_NATIVE_VERSION_MAJOR) && defined(REACT_NATIVE_VERSION_MINOR) && \
    (REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 86)
#define EXPO_JSI_HAS_RN_086 1
#else
#define EXPO_JSI_HAS_RN_086 0
namespace facebook::jsi {
using IRuntime = Runtime;
} // namespace facebook::jsi
#endif

#endif // __cplusplus
