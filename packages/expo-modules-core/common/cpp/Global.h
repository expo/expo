#pragma once

#ifdef __cplusplus

#import <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

/**
 Gets the core Expo object, i.e. `global.expo`.
 */
inline jsi::Object getCoreObject(jsi::Runtime &runtime) {
  return runtime.global().getPropertyAsObject(runtime, "expo");
}

} // namespace expo

#endif // __cplusplus
