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
  if (jsiObject == nullptr) {
    auto hostObject = std::make_shared<JavaScriptModuleObject::HostObject>(this);
    jsiObject = std::make_shared<jsi::Object>(
      jsi::Object::createFromHostObject(runtime, hostObject));
  }

  return jsiObject;
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

JavaScriptModuleObject::HostObject::HostObject(
  JavaScriptModuleObject *jsModule) : jsModule(jsModule) {}

/**
 * Clears all the JSI references held by the `JavaScriptModuleObject`.
 */
JavaScriptModuleObject::HostObject::~HostObject() {
  if (jsModule->jsiObject != nullptr) {
    jsModule->jsiObject.reset();
  }
  jsModule->methodsMetadata.clear();
  jsModule->constants.clear();
  jsModule->properties.clear();
  jsModule->longLivedObjectCollection_->clear();
}

jsi::Value JavaScriptModuleObject::HostObject::get(jsi::Runtime &runtime,
                                                   const jsi::PropNameID &name) {
  auto cName = name.utf8(runtime);

  auto constantsRecord = jsModule->constants.find(cName);
  if (constantsRecord != jsModule->constants.end()) {
    auto dynamic = constantsRecord->second;
    return jsi::valueFromDynamic(runtime, dynamic);
  }

  auto propertyRecord = jsModule->properties.find(cName);
  if (propertyRecord != jsModule->properties.end()) {
    auto&[getter, _] = propertyRecord->second;
    return getter.callSync(runtime, jsModule->jsiInteropModuleRegistry, nullptr, 0);
  }

  auto metadataRecord = jsModule->methodsMetadata.find(cName);
  if (metadataRecord == jsModule->methodsMetadata.end()) {
    return jsi::Value::undefined();
  }
  auto &metadata = metadataRecord->second;
  return jsi::Value(runtime, *metadata.toJSFunction(runtime, jsModule->jsiInteropModuleRegistry));
}

void JavaScriptModuleObject::HostObject::set(
  jsi::Runtime &runtime,
  const jsi::PropNameID &name,
  const jsi::Value &value
) {
  auto cName = name.utf8(runtime);
  auto propertyRecord = jsModule->properties.find(cName);
  if (propertyRecord != jsModule->properties.end()) {
    auto&[_, setter] = propertyRecord->second;
    setter.callSync(runtime, jsModule->jsiInteropModuleRegistry, &value, 1);
    return;
  }

  throw jsi::JSError(
    runtime,
    "RuntimeError: Cannot override the host object for expo module '" + name.utf8(runtime) + "'"
  );
}

std::vector<jsi::PropNameID> JavaScriptModuleObject::HostObject::getPropertyNames(
  jsi::Runtime &rt
) {
  auto &metadata = jsModule->methodsMetadata;
  std::vector<jsi::PropNameID> result;
  std::transform(
    metadata.begin(),
    metadata.end(),
    std::back_inserter(result),
    [&rt](const auto &kv) {
      return jsi::PropNameID::forUtf8(rt, kv.first);
    }
  );

  auto &constants = jsModule->constants;
  std::transform(
    constants.begin(),
    constants.end(),
    std::back_inserter(result),
    [&rt](const auto &kv) {
      return jsi::PropNameID::forUtf8(rt, kv.first);
    }
  );

  auto &properties = jsModule->properties;
  std::transform(
    properties.begin(),
    properties.end(),
    std::back_inserter(result),
    [&rt](const auto &kv) {
      return jsi::PropNameID::forUtf8(rt, kv.first);
    }
  );

  return result;
}

JavaScriptModuleObject::JavaScriptModuleObject(jni::alias_ref<jhybridobject> jThis)
  : javaPart_(jni::make_global(jThis)) {
  longLivedObjectCollection_ = std::make_shared<react::LongLivedObjectCollection>();
}

} // namespace expo
