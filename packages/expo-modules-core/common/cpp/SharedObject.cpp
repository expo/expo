// Copyright 2024-present 650 Industries. All rights reserved.

#include "SharedObject.h"
#include "JSIUtils.h"

namespace expo::SharedObject {

#pragma mark - NativeState

NativeState::NativeState(const ObjectId objectId, const ObjectReleaser releaser)
: objectId(objectId), releaser(releaser), jsi::NativeState() {}

NativeState::~NativeState() {
  releaser(objectId);
}

#pragma mark - Utils

void installBaseClass(jsi::Runtime &runtime, const ObjectReleaser releaser) {
  jsi::Function klass = expo::common::createClass(runtime, "SharedObject");
  jsi::Object prototype = klass.getPropertyAsObject(runtime, "prototype");

  jsi::Function releaseFunction = jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "release"),
    1,
    [releaser](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
      jsi::Object thisObject = args[0].asObject(runtime);

      if (thisObject.hasNativeState<NativeState>(runtime)) {
        auto nativeState = thisObject.getNativeState<NativeState>(runtime);

        releaser(nativeState->objectId);

        // Should we reset the native state?
        thisObject.setNativeState(runtime, nullptr);
      }
      return jsi::Value::undefined();
    });

  prototype.setProperty(runtime, "release", releaseFunction);

  // This property should be deprecated, but it's still used when passing as a view prop.
  defineProperty(runtime, &prototype, "__expo_shared_object_id__", common::PropertyDescriptor {
    .get = [](jsi::Runtime &runtime, jsi::Object thisObject) {
      if (thisObject.hasNativeState<NativeState>(runtime)) {
        auto nativeState = thisObject.getNativeState<NativeState>(runtime);
        return jsi::Value((int)nativeState->objectId);
      }
      return jsi::Value(0);
    }
  });

  runtime
    .global()
    .getPropertyAsObject(runtime, "expo")
    .setProperty(runtime, "SharedObject", klass);
}

jsi::Function getBaseClass(jsi::Runtime &runtime) {
  return runtime
    .global()
    .getPropertyAsObject(runtime, "expo")
    .getPropertyAsFunction(runtime, "SharedObject");
}

jsi::Function createClass(jsi::Runtime &runtime, const char *className, common::ClassConstructor constructor) {
  jsi::Function baseSharedObjectClass = getBaseClass(runtime);
  return common::createInheritingClass(runtime, className, baseSharedObjectClass, constructor);
}

} // namespace expo::SharedObject
