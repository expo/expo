// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once
#ifdef __cplusplus

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo::common {

/**
 Converts `jsi::Array` to a vector with prop name ids (`std::vector<jsi::PropNameID>`).
 */
std::vector<jsi::PropNameID> jsiArrayToPropNameIdsVector(jsi::Runtime &runtime, const jsi::Array &array);

/**
 Calls Object.defineProperty(jsThis, name, descriptor)`.
 */
void definePropertyOnJSIObject(
  jsi::Runtime &runtime,
  jsi::Object *jsthis,
  const char *name,
  jsi::Object descriptor
);

} // namespace expo::common

#endif // __cplusplus
