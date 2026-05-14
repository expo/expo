#pragma once
#ifdef __cplusplus

#include <jsi/jsi.h>

// React Native 0.86 split the JSI API into the abstract `jsi::IRuntime` base
// and the concrete `jsi::Runtime` derived class — most value/object/function
// methods now take `IRuntime&` instead of `Runtime&`. Older React Native
// versions (e.g. react-native-tvos 0.85) only have `jsi::Runtime`. Alias
// `IRuntime` to `Runtime` there so the same source compiles against both.
#if __has_include(<cxxreact/ReactNativeVersion.h>)
#include <cxxreact/ReactNativeVersion.h>
#endif

#if !defined(REACT_NATIVE_VERSION_MAJOR) || \
    (REACT_NATIVE_VERSION_MAJOR == 0 && REACT_NATIVE_VERSION_MINOR < 86)
namespace facebook::jsi {
using IRuntime = Runtime;
} // namespace facebook::jsi
#endif

#endif // __cplusplus
