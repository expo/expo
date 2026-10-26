// Copyright 2022-present 650 Industries. All rights reserved.

#include <utility>
#include "JSIUtils.h"

namespace expo::common {

static constexpr jsi::UUID classFactoryUUID{0xa1f49c57, 0x6f0a, 0x4775, 0x9f44, 0xcb0673675b4c};

// Hermes keeps memory for every evaluated source until the runtime is destroyed, so the
// constructor source is evaluated once per runtime and the factory is called for each class.
// The runtime data releases the factory when the runtime is destroyed, and JS code can't reach it.
static std::shared_ptr<jsi::Function> getClassFactory(jsi::Runtime &runtime) {
  if (std::shared_ptr<void> cached = runtime.getRuntimeData(classFactoryUUID)) {
    return std::static_pointer_cast<jsi::Function>(cached);
  }
  std::shared_ptr<jsi::StringBuffer> sourceBuffer = std::make_shared<jsi::StringBuffer>(
    "(function (name) {"
    "  const klass = function (...args) { return this.__native_constructor__(...args); };"
    "  Object.defineProperty(klass, 'name', { value: name });"
    "  return klass;"
    "})"
  );
  auto factory = std::make_shared<jsi::Function>(
    runtime.evaluateJavaScript(sourceBuffer, "expo-modules-core/class-factory.js").asObject(runtime).asFunction(runtime)
  );
  runtime.setRuntimeData(classFactoryUUID, factory);
  return factory;
}

jsi::Function createClass(jsi::Runtime &runtime, const char *name, ClassConstructor constructor) {
  std::string nativeConstructorKey("__native_constructor__");

  jsi::Object klass = getClassFactory(runtime)
    ->call(runtime, jsi::String::createFromUtf8(runtime, name))
    .asObject(runtime);

  // Set the native constructor in the prototype.
  jsi::Object prototype = klass.getPropertyAsObject(runtime, "prototype");
  jsi::PropNameID nativeConstructorPropId = jsi::PropNameID::forAscii(runtime, nativeConstructorKey);
  jsi::Function nativeConstructor = jsi::Function::createFromHostFunction(
    runtime,
    nativeConstructorPropId,
    // The paramCount is not obligatory to match, it only affects the `length` property of the function.
    0,
    [constructor = std::move(constructor)](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
      if (constructor) {
        return constructor(runtime, thisValue, args, count);
      }
      return jsi::Value(runtime, thisValue);
    });

  jsi::Object descriptor(runtime);
  descriptor.setProperty(runtime, "value", jsi::Value(runtime, nativeConstructor));

  defineProperty(runtime, &prototype, nativeConstructorKey.c_str(), std::move(descriptor));

  return klass.asFunction(runtime);
}

jsi::Function createInheritingClass(jsi::Runtime &runtime, const char *className, jsi::Function &baseClass, ClassConstructor constructor) {
  jsi::PropNameID prototypePropNameId = jsi::PropNameID::forAscii(runtime, "prototype", 9);
  jsi::Object baseClassPrototype = baseClass
    .getProperty(runtime, prototypePropNameId)
    .asObject(runtime);

  jsi::Function klass = createClass(runtime, className, std::move(constructor));
  jsi::Object klassPrototype = klass.getProperty(runtime, prototypePropNameId).asObject(runtime);

  klassPrototype.setProperty(runtime, "__proto__", baseClassPrototype);

  return klass;
}

jsi::Object createObjectWithPrototype(jsi::Runtime &runtime, jsi::Object *prototype) {
  // Get the "Object" class.
  jsi::Object objectClass = runtime
    .global()
    .getPropertyAsObject(runtime, "Object");

  // Call "Object.create(prototype)" to create an object with the given prototype without calling the constructor.
  jsi::Object object = objectClass
    .getPropertyAsFunction(runtime, "create")
    .callWithThis(runtime, objectClass, {
      jsi::Value(runtime, *prototype)
    })
    .asObject(runtime);

  return object;
}

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

static jsi::Object createDescriptorObject(jsi::Runtime &runtime, const PropertyDescriptor& descriptor) {
  jsi::Object jsDescriptor(runtime);

  // These three flags are all `false` by default, so set the property only when `true`.
  if (descriptor.configurable) {
    jsDescriptor.setProperty(runtime, "configurable", jsi::Value(true));
  }
  if (descriptor.enumerable) {
    jsDescriptor.setProperty(runtime, "enumerable", jsi::Value(true));
  }
  if (descriptor.writable) {
    jsDescriptor.setProperty(runtime, "writable", jsi::Value(true));
  }

  if (descriptor.get) {
    jsi::PropNameID getPropName = jsi::PropNameID::forAscii(runtime, "get", 3);
    jsi::Function get = jsi::Function::createFromHostFunction(
      runtime,
      getPropName,
      0,
      [getter = descriptor.get](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
        return getter(runtime, thisValue.asObject(runtime));
      });

    jsDescriptor.setProperty(runtime, getPropName, get);
  }
  if (descriptor.set) {
    jsi::PropNameID setPropName = jsi::PropNameID::forAscii(runtime, "set", 3);
    jsi::Function set = jsi::Function::createFromHostFunction(
      runtime,
      setPropName,
      1,
      [setter = descriptor.set](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
        setter(runtime, thisValue.asObject(runtime), jsi::Value(runtime, args[0]));
        return jsi::Value::undefined();
      });

    jsDescriptor.setProperty(runtime, setPropName, set);
  }
  if (!descriptor.value.isUndefined()) {
    jsi::PropNameID valuePropName = jsi::PropNameID::forAscii(runtime, "value", 5);
    jsDescriptor.setProperty(runtime, valuePropName, descriptor.value);
  }

  return jsDescriptor;
}

static void callDefineProperty(jsi::Runtime &runtime, jsi::Object *object, jsi::Value key, jsi::Object descriptor) {
  jsi::Object global = runtime.global();
  jsi::Object objectClass = global.getPropertyAsObject(runtime, "Object");
  jsi::Function definePropertyFunction = objectClass.getPropertyAsFunction(runtime, "defineProperty");

  // This call is basically the same as `Object.defineProperty(object, key, descriptor)` in JS
  definePropertyFunction.callWithThis(runtime, objectClass, {
    jsi::Value(runtime, *object),
    std::move(key),
    std::move(descriptor),
  });
}

void defineProperty(jsi::Runtime &runtime, jsi::Object *object, const char *name, const PropertyDescriptor& descriptor) {
  callDefineProperty(runtime, object, jsi::String::createFromUtf8(runtime, name), createDescriptorObject(runtime, descriptor));
}

void defineProperty(jsi::Runtime &runtime, jsi::Object *object, const jsi::Symbol &key, const PropertyDescriptor& descriptor) {
  callDefineProperty(runtime, object, jsi::Value(runtime, key), createDescriptorObject(runtime, descriptor));
}

void defineProperty(jsi::Runtime &runtime, jsi::Object *object, const char *name, jsi::Object descriptor) {
  callDefineProperty(runtime, object, jsi::String::createFromUtf8(runtime, name), std::move(descriptor));
}

} // namespace expo::common
