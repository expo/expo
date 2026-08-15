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
  assert((!runtimeHolder.expired()) && "JS Runtime was used after deallocation");
}

std::shared_ptr<jsi::Function> JavaScriptFunction::get() {
  return jsFunction;
}

jobject JavaScriptFunction::invoke(
  jni::alias_ref<JavaScriptObject::javaobject> jsThis,
  jni::alias_ref<jni::JArrayClass<jobject>> args,
  jni::alias_ref<ExpectedType::javaobject> expectedReturnType
) {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  JNIEnv *env = jni::Environment::current();
  std::vector<jsi::Value> convertedArgs = convertArray(env, rawRuntime, args);

  // TODO(@lukmccall): add better error handling
  jsi::Value result = jsThis == nullptr ?
    jsFunction->call(
      rawRuntime,
      (const jsi::Value *) convertedArgs.data(),
      convertedArgs.size()
    ) :
    jsFunction->callWithThis(
      rawRuntime,
      *(jsThis->cthis()->get()),
      (const jsi::Value *) convertedArgs.data(),
      convertedArgs.size()
    );

  auto converter = AnyType(jni::make_local(expectedReturnType)).converter;
  auto convertedResult = converter->convert(rawRuntime, env, result);
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
