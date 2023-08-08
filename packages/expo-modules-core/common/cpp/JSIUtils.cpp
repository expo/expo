// Copyright 2022-present 650 Industries. All rights reserved.

#include "JSIUtils.h"

namespace expo::common {

std::vector<jsi::PropNameID> jsiArrayToPropNameIdsVector(jsi::Runtime &runtime, const jsi::Array &array) {
  size_t size = array.size(runtime);
  std::vector<jsi::PropNameID> vector;

  vector.reserve(size);

  for (size_t i = 0; i < size; i++) {
    jsi::String name = array.getValueAtIndex(runtime, i).getString(runtime);
    vector.push_back(jsi::PropNameID::forString(runtime, name));
  }
  return vector;
}

void definePropertyOnJSIObject(
  jsi::Runtime &runtime,
  jsi::Object *jsthis,
  const char *name,
  jsi::Object descriptor
) {
  jsi::Object global = runtime.global();
  jsi::Object objectClass = global.getPropertyAsObject(runtime, "Object");
  jsi::Function definePropertyFunction = objectClass.getPropertyAsFunction(
    runtime,
    "defineProperty"
  );

  // This call is basically the same as `Object.defineProperty(object, name, descriptor)` in JS
  definePropertyFunction.callWithThis(runtime, objectClass, {
    jsi::Value(runtime, *jsthis),
    jsi::String::createFromUtf8(runtime, name),
    std::move(descriptor),
  });
}

} // namespace expo::common
