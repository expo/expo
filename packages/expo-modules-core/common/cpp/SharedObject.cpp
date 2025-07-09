// Copyright 2024-present 650 Industries. All rights reserved.

#include "SharedObject.h"
#include "JSIUtils.h"

namespace expo::SharedObject {

#pragma mark - NativeState

NativeState::NativeState(ObjectId objectId, ObjectReleaser releaser)
: EventEmitter::NativeState(), objectId(objectId), releaser(std::move(releaser)) {}

NativeState::~NativeState() {
  releaser(objectId);
}

#pragma mark - Utils

void installBaseClass(jsi::Runtime &runtime, const ObjectReleaser& releaser) {
  jsi::Function baseClass = EventEmitter::getClass(runtime);
  jsi::Function klass = expo::common::createInheritingClass(runtime, "SharedObject", baseClass);
  jsi::Object prototype = klass.getPropertyAsObject(runtime, "prototype");

  jsi::Function releaseFunction = jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "release"),
    1,
    [releaser](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
      jsi::Object thisObject = thisValue.getObject(runtime);

      if (thisObject.hasNativeState<NativeState>(runtime)) {
        auto nativeState = thisObject.getNativeState<NativeState>(runtime);

        releaser(nativeState->objectId);

        // Should we reset the native state?
        thisObject.setNativeState(runtime, nullptr);
      }
      return jsi::Value::undefined();
    });

  // Implements a JSON serializer for shared objects, whose properties are defined in the prototype instead of the instance itself.
  // By default `JSON.stringify` visits only enumerable own properties.
  jsi::Function toJSONFunction = jsi::Function::createFromHostFunction(
    runtime,
    jsi::PropNameID::forAscii(runtime, "toJSON"),
    0,
    [](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
      jsi::Object thisObject = thisValue.getObject(runtime);
      jsi::Object json = jsi::Object(runtime);
      jsi::Array propertyNames = thisObject.getPropertyNames(runtime);

      for (size_t i = 0, size = propertyNames.size(runtime); i < size; i++) {
        jsi::String propertyName = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
        jsi::Value value = thisObject.getProperty(runtime, propertyName);

        if (!value.isObject() || !value.getObject(runtime).isFunction(runtime)) {
          json.setProperty(runtime, propertyName, value);
        }
      }
      return jsi::Value(runtime, json);
    });

  prototype.setProperty(runtime, "release", releaseFunction);
  prototype.setProperty(runtime, "toJSON", toJSONFunction);

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

  common::getCoreObject(runtime)
    .setProperty(runtime, "SharedObject", klass);
}

jsi::Function getBaseClass(jsi::Runtime &runtime) {
  return common::getCoreObject(runtime)
    .getPropertyAsFunction(runtime, "SharedObject");
}

jsi::Function createClass(jsi::Runtime &runtime, const char *className, common::ClassConstructor constructor) {
  jsi::Function baseSharedObjectClass = getBaseClass(runtime);
  return common::createInheritingClass(runtime, className, baseSharedObjectClass, std::move(constructor));
}

} // namespace expo::SharedObject
