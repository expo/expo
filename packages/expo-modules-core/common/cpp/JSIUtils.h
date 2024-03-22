// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once
#ifdef __cplusplus

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo::common {

#pragma mark - Helpers

/**
 Gets the core Expo object, i.e. `global.expo`.
 */
inline jsi::Object getCoreObject(jsi::Runtime &runtime) {
  return runtime.global().getPropertyAsObject(runtime, "expo");
}

#pragma mark - Classes

/**
 Type of the native constructor of the JS classes.
 */
typedef std::function<jsi::Value(jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count)> ClassConstructor;

/**
 Creates a class with the given name and native constructor.
 */
jsi::Function createClass(jsi::Runtime &runtime, const char *name, ClassConstructor constructor = nullptr);

/**
 Creates a class (function) that inherits from the provided base class.
 */
jsi::Function createInheritingClass(jsi::Runtime &runtime, const char *className, jsi::Function &baseClass, ClassConstructor constructor = nullptr);

/**
 Creates an object from the given prototype, without calling the constructor.
 */
jsi::Object createObjectWithPrototype(jsi::Runtime &runtime, jsi::Object *prototype);

#pragma mark - Conversions

/**
 Converts `jsi::Array` to a vector with prop name ids (`std::vector<jsi::PropNameID>`).
 */
std::vector<jsi::PropNameID> jsiArrayToPropNameIdsVector(jsi::Runtime &runtime, const jsi::Array &array);

#pragma mark - Properties

/**
 Represents a JS property descriptor used in the `Object.defineProperty` function.
 */
struct PropertyDescriptor {
  const bool configurable = false;
  const bool enumerable = false;
  const bool writable = false;
  const jsi::Value value = jsi::Value::undefined();
  const std::function<jsi::Value(jsi::Runtime &runtime, jsi::Object thisObject)> get = 0;
  const std::function<void(jsi::Runtime &runtime, jsi::Object thisObject, jsi::Value newValue)> set = 0;
}; // PropertyDescriptor

/**
 Defines the property on the object with the provided descriptor options.
 */
void defineProperty(jsi::Runtime &runtime, jsi::Object *object, const char *name, const PropertyDescriptor descriptor);

/**
 Calls `Object.defineProperty(object, name, descriptor)`.
 */
void defineProperty(jsi::Runtime &runtime, jsi::Object *object, const char *name, jsi::Object descriptor);

} // namespace expo::common

#endif // __cplusplus
