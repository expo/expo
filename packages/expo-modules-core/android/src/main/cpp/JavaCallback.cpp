// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaCallback.h"
#include "JSIInteropModuleRegistry.h"

namespace expo {

JavaCallback::JavaCallback(Callback callback)
  : callback(std::move(callback)) {}


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
                 });
}

jni::local_ref<JavaCallback::javaobject> JavaCallback::newInstance(
  JSIInteropModuleRegistry *jsiInteropModuleRegistry,
  Callback callback
) {
  auto object = JavaCallback::newObjectCxxArgs(std::move(callback));
  jsiInteropModuleRegistry->jniDeallocator->addReference(object);
  return object;
}

void JavaCallback::invoke() {
  callback(nullptr);
}

void JavaCallback::invokeBool(bool result) {
  callback(result);
}

void JavaCallback::invokeInt(int result) {
  callback(result);
}

void JavaCallback::invokeDouble(double result) {
  callback(result);
}

void JavaCallback::invokeFloat(float result) {
  callback(result);
}

void JavaCallback::invokeString(jni::alias_ref<jstring> result) {
  callback(result->toStdString());
}

void JavaCallback::invokeArray(jni::alias_ref<react::WritableNativeArray::javaobject> result) {
  callback(result->cthis()->consume());
}

void JavaCallback::invokeMap(jni::alias_ref<react::WritableNativeMap::javaobject> result) {
  callback(result->cthis()->consume());
}
} // namespace expo
