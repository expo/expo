// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaCallback.h"
#include "JSIInteropModuleRegistry.h"
#include <fbjni/fbjni.h>
#include <fbjni/fbjni.h>
#include <folly/dynamic.h>

namespace expo {

JavaCallback::JavaCallback(Callback callback)
  : callback(std::move(callback)) {}

JSIInteropModuleRegistry* JavaCallback::jsiRegistry_ = nullptr;

void JavaCallback::registerNatives() {
  registerHybrid({
                   makeNativeMethod("invoke", JavaCallback::invoke),
                   makeNativeMethod("invoke", JavaCallback::invokeBool),
                   makeNativeMethod("invoke", JavaCallback::invokeInt),
                   makeNativeMethod("invoke", JavaCallback::invokeDouble),
                   makeNativeMethod("invoke", JavaCallback::invokeFloat),
                   makeNativeMethod("invoke", JavaCallback::invokeString),
                   makeNativeMethod("invoke", JavaCallback::invokeArray),
                   makeNativeMethod("invoke", JavaCallback::invokeMap),
                   makeNativeMethod("invoke", JavaCallback::invokeSharedRef),
                 });
}

void SharedRef::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", SharedRef::initHybrid)
                 });
}

jni::local_ref<SharedRef::jhybriddata>
SharedRef::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance();
}

jni::local_ref<SharedRef::jhybriddata>
SharedObjectId::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance();
}

SharedRef::SharedRef() = default;

SharedObjectId::SharedObjectId() = default;

jni::local_ref<JavaCallback::javaobject> JavaCallback::newInstance(
  JSIInteropModuleRegistry *jsiInteropModuleRegistry,
  Callback callback
) {
  auto object = JavaCallback::newObjectCxxArgs(std::move(callback));
  jsiRegistry_ = jsiInteropModuleRegistry;
  jsiInteropModuleRegistry->jniDeallocator->addReference(object);
  return object;
}

void JavaCallback::invoke() {

  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::DYNAMIC, { nullptr } });
  callback(std::move(callbackArg));
}

void JavaCallback::invokeBool(bool result) {
  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::DYNAMIC, { std::make_unique<folly::dynamic>(result) }});
  callback(std::move(callbackArg));
}

void JavaCallback::invokeInt(int result) {
  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::DYNAMIC, { std::make_unique<folly::dynamic>(result) }});
  callback(std::move(callbackArg));
}

void JavaCallback::invokeDouble(double result) {
  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::DYNAMIC, { std::make_unique<folly::dynamic>(result) }});
  callback(std::move(callbackArg));
}

void JavaCallback::invokeFloat(float result) {
  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::DYNAMIC, { std::make_unique<folly::dynamic>(result) }});
  callback(std::move(callbackArg));
}

void JavaCallback::invokeString(jni::alias_ref<jstring> result) {
  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::DYNAMIC, { std::make_unique<folly::dynamic>(result->toStdString()) }});
  callback(std::move(callbackArg));
}

void JavaCallback::invokeArray(jni::alias_ref<react::WritableNativeArray::javaobject> result) {
  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::DYNAMIC, { std::make_unique<folly::dynamic>(result->cthis()->consume()) }});
  callback(std::move(callbackArg));
}

void JavaCallback::invokeMap(jni::alias_ref<react::WritableNativeMap::javaobject> result) {
  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::DYNAMIC, { std::make_unique<folly::dynamic>(result->cthis()->consume()) }});
  callback(std::move(callbackArg));
}

void JavaCallback::invokeSharedRef(jni::alias_ref<SharedRef::javaobject> result) {
  std::unique_ptr<CallbackArg> callbackArg(new CallbackArg { CallbackArgType::SHARED_REF, {nullptr, jni::make_global(result)}});
  callback(std::move(callbackArg));
}
} // namespace expo
