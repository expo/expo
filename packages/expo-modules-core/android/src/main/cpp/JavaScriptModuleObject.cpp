// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptModuleObject.h"

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <react/jni/ReadableNativeArray.h>

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
                   makeNativeMethod("registerSyncFunction",
                                    JavaScriptModuleObject::registerSyncFunction),
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

void JavaScriptModuleObject::registerSyncFunction(jni::alias_ref<jstring> name, jint args) {
  auto cName = name->toStdString();
  methodsMetadata.emplace(std::piecewise_construct,
                          std::forward_as_tuple(cName),
                          std::forward_as_tuple(cName, args, false));
}

jni::local_ref<react::ReadableNativeArray::javaobject>
JavaScriptModuleObject::callSyncMethod(jni::local_ref<jstring> &&name,
                                       react::ReadableNativeArray::javaobject &&args) {
  static const auto method = JavaScriptModuleObject::javaClassLocal()
    ->getMethod<react::ReadableNativeArray::javaobject(
      jni::local_ref<jstring>,
      react::ReadableNativeArray::javaobject)>(
      "callSyncMethod"
    );

  return method(javaPart_.get(), std::move(name), args);
}

JavaScriptModuleObject::HostObject::HostObject(
  JavaScriptModuleObject *jsModule) : jsModule(jsModule) {}

jsi::Value JavaScriptModuleObject::HostObject::get(jsi::Runtime &runtime,
                                                   const jsi::PropNameID &name) {
  auto cName = name.utf8(runtime);
  auto metadataRecord = jsModule->methodsMetadata.find(cName);
  if (metadataRecord == jsModule->methodsMetadata.end()) {
    return jsi::Value::undefined();
  }
  auto metadata = metadataRecord->second;

  if (metadata.body == nullptr) {
    auto body = jsi::Function::createFromHostFunction(
      runtime,
      jsi::PropNameID::forAscii(runtime, metadata.name),
      metadata.args,
      [&jsModule = jsModule, cName](
        jsi::Runtime &rt,
        const jsi::Value &thisValue,
        const jsi::Value *args,
        size_t count
      ) -> jsi::Value {
        auto dynamicArray = folly::dynamic::array();
        for (int i = 0; i < count; i++) {
          auto &arg = args[i];
          dynamicArray.push_back(jsi::dynamicFromValue(rt, arg));
        }

        auto result = jsModule->callSyncMethod(
          jni::make_jstring(cName),
          react::ReadableNativeArray::newObjectCxxArgs(std::move(dynamicArray)).get()
        );

        if (result == nullptr) {
          return jsi::Value::undefined();
        }

        return jsi::valueFromDynamic(rt, result->cthis()->consume())
          .asObject(rt)
          .asArray(rt)
          .getValueAtIndex(rt, 0);
      }
    );

    metadata.body = std::make_shared<jsi::Function>(std::move(body));
  }

  return jsi::Value(runtime, *metadata.body);
}

void
JavaScriptModuleObject::HostObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name,
                                        const jsi::Value &value) {
  std::string message("RuntimeError: Cannot override the host object for expo module '");
  message += name.utf8(runtime);
  throw jsi::JSError(runtime, message);
}

std::vector<jsi::PropNameID>
JavaScriptModuleObject::HostObject::getPropertyNames(jsi::Runtime &rt) {
  auto metadata = jsModule->methodsMetadata;
  std::vector<jsi::PropNameID> result;
  std::transform(
    metadata.begin(),
    metadata.end(),
    std::back_inserter(result),
    [&rt](const auto &kv) {
      return jsi::PropNameID::forUtf8(rt, kv.first);
    }
  );

  return result;
}
}
