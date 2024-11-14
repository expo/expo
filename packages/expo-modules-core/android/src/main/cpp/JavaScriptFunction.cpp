// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptFunction.h"
#include "types/JNIToJSIConverter.h"
#include "types/AnyType.h"

#include "JavaScriptObject.h"

namespace expo {

void JavaScriptFunction::registerNatives() {
  registerHybrid({
                   makeNativeMethod("invoke", JavaScriptFunction::invoke),
                 });
}

JavaScriptFunction::JavaScriptFunction(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Function> jsFunction
) : runtimeHolder(std::move(runtime)), jsFunction(std::move(jsFunction)) {
  runtimeHolder.ensureRuntimeIsValid();
}

JavaScriptFunction::JavaScriptFunction(
  WeakRuntimeHolder runtime,
  std::shared_ptr<jsi::Function> jsFunction
) : runtimeHolder(std::move(runtime)), jsFunction(std::move(jsFunction)) {
  runtimeHolder.ensureRuntimeIsValid();
}

std::shared_ptr<jsi::Function> JavaScriptFunction::get() {
  return jsFunction;
}

jobject JavaScriptFunction::invoke(
  jni::alias_ref<JavaScriptObject::javaobject> jsThis,
  jni::alias_ref<jni::JArrayClass<jni::JObject>> args,
  jni::alias_ref<ExpectedType::javaobject> expectedReturnType
) {
  auto &rt = runtimeHolder.getJSRuntime();
  JNIEnv *env = jni::Environment::current();

  size_t size = args->size();
  std::vector<jsi::Value> convertedArgs;
  convertedArgs.reserve(size);

  for (size_t i = 0; i < size; i++) {
    jni::local_ref<jobject> arg = args->getElement(i);
    convertedArgs.push_back(convert(env, rt, std::move(arg)));
  }

  // TODO(@lukmccall): add better error handling
  jsi::Value result = jsThis == nullptr ?
    jsFunction->call(
      rt,
      (const jsi::Value *) convertedArgs.data(),
      size
    ) :
    jsFunction->callWithThis(
      rt,
      *(jsThis->cthis()->get()),
      (const jsi::Value *) convertedArgs.data(),
      size
    );

  auto converter = AnyType(jni::make_local(expectedReturnType)).converter;
  auto convertedResult = converter->convert(rt, env, result);
  return convertedResult;
}

jni::local_ref<JavaScriptFunction::javaobject> JavaScriptFunction::newInstance(
  JSIContext *jsiContext,
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Function> jsFunction
) {
  auto function = JavaScriptFunction::newObjectCxxArgs(
    std::move(runtime),
    std::move(jsFunction)
  );
  jsiContext->jniDeallocator->addReference(function);
  return function;
}
} // namespace expo
