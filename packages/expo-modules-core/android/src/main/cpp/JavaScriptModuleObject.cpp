// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptModuleObject.h"
#include "JSIInteropModuleRegistry.h"

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <react/jni/ReadableNativeArray.h>
#include <fbjni/detail/Hybrid.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jni/JCallback.h>
#include <jsi/JSIDynamic.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <utility>
#include <tuple>
#include <algorithm>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

jni::local_ref<jni::HybridClass<JavaScriptModuleObject>::jhybriddata>
JavaScriptModuleObject::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void JavaScriptModuleObject::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", JavaScriptModuleObject::initHybrid),
                   makeNativeMethod("exportConstants", JavaScriptModuleObject::exportConstants),
                   makeNativeMethod("registerSyncFunction",
                                    JavaScriptModuleObject::registerSyncFunction),
                   makeNativeMethod("registerAsyncFunction",
                                    JavaScriptModuleObject::registerAsyncFunction),
                   makeNativeMethod("registerProperty",
                                    JavaScriptModuleObject::registerProperty),
                 });
}

std::shared_ptr<jsi::Object> JavaScriptModuleObject::getJSIObject(jsi::Runtime &runtime) {
  if (auto object = jsiObject.lock()) {
    return object;
  }

  auto moduleObject = std::make_shared<jsi::Object>(runtime);

  for (const auto &[name, value]: constants) {
    moduleObject->setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::valueFromDynamic(runtime, value)
    );
  }

  for (auto &[name, property]: properties) {
    auto &[getter, setter] = property;

    auto descriptor = JavaScriptObject::preparePropertyDescriptor(runtime, 1 << 1 /* enumerable */);
    descriptor.setProperty(runtime, "get", jsi::Value(runtime, *getter.toJSFunction(runtime,
                                                                                    jsiInteropModuleRegistry)));
    descriptor.setProperty(runtime, "set", jsi::Value(runtime, *setter.toJSFunction(runtime,
                                                                                    jsiInteropModuleRegistry)));
    JavaScriptObject::defineProperty(runtime, moduleObject, name, std::move(descriptor));
  }

  for (auto &[name, method]: methodsMetadata) {
    moduleObject->setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::Value(runtime, *method.toJSFunction(runtime, jsiInteropModuleRegistry))
    );
  }

  jsiObject = moduleObject;
  return moduleObject;
}

void JavaScriptModuleObject::exportConstants(
  jni::alias_ref<react::NativeMap::javaobject> constants
) {
  auto dynamic = constants->cthis()->consume();
  assert(dynamic.isObject());

  for (const auto &[key, value]: dynamic.items()) {
    this->constants[key.asString()] = value;
  }
}

void JavaScriptModuleObject::registerSyncFunction(
  jni::alias_ref<jstring> name,
  jint args,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();

  methodsMetadata.try_emplace(
    cName,
    longLivedObjectCollection_,
    cName,
    args,
    false,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );
}

void JavaScriptModuleObject::registerAsyncFunction(
  jni::alias_ref<jstring> name,
  jint args,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();

  methodsMetadata.try_emplace(
    cName,
    longLivedObjectCollection_,
    cName,
    args,
    true,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );
}

void JavaScriptModuleObject::registerProperty(
  jni::alias_ref<jstring> name,
  jni::alias_ref<ExpectedType> expectedArgType,
  jni::alias_ref<JNIFunctionBody::javaobject> getter,
  jni::alias_ref<JNIFunctionBody::javaobject> setter
) {
  auto cName = name->toStdString();

  auto getterMetadata = MethodMetadata(
    longLivedObjectCollection_,
    cName,
    0,
    false,
    std::vector<std::unique_ptr<AnyType>>(),
    jni::make_global(getter)
  );

  auto types = std::vector<std::unique_ptr<AnyType>>();
  types.push_back(std::make_unique<AnyType>(jni::make_local(expectedArgType)));
  auto setterMetadata = MethodMetadata(
    longLivedObjectCollection_,
    cName,
    1,
    false,
    std::move(types),
    jni::make_global(setter)
  );

  auto functions = std::make_pair(
    std::move(getterMetadata),
    std::move(setterMetadata)
  );

  properties.insert({cName, std::move(functions)});
}

JavaScriptModuleObject::JavaScriptModuleObject(jni::alias_ref<jhybridobject> jThis)
  : javaPart_(jni::make_global(jThis)) {
  longLivedObjectCollection_ = std::make_shared<react::LongLivedObjectCollection>();
}
} // namespace expo
