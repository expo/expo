// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaCallback.h"
#include "JSIInteropModuleRegistry.h"
#include <fbjni/fbjni.h>
#include <fbjni/fbjni.h>
#include <folly/dynamic.h>

namespace expo {

JavaCallback::JavaCallback(Callback callback)
  : callback(std::move(callback)) {}

JSIInteropModuleRegistry *JavaCallback::jsiRegistry_ = nullptr;

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
  // passing null
  callback(folly::dynamic());
}

void JavaCallback::invokeBool(bool result) {
  callback({result});
}

void JavaCallback::invokeInt(int result) {
  callback({result});
}

void JavaCallback::invokeDouble(double result) {
  callback({result});
}

void JavaCallback::invokeFloat(float result) {
  callback({result});
}

void JavaCallback::invokeString(jni::alias_ref<jstring> result) {
  callback({result->toStdString()});
}

void JavaCallback::invokeArray(jni::alias_ref<react::WritableNativeArray::javaobject> result) {
  callback({result->cthis()->consume()});
}

void JavaCallback::invokeMap(jni::alias_ref<react::WritableNativeMap::javaobject> result) {
  callback({result->cthis()->consume()});
}

void JavaCallback::invokeSharedRef(jni::alias_ref<SharedRef::javaobject> result) {
  callback({jni::make_global(result)});
}
} // namespace expo
