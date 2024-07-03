// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSFunctionsDecorator.h"

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

void JSFunctionsDecorator::registerSyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();
  auto methodMetadata = std::make_shared<MethodMetadata>(
    cName,
    takesOwner &
    0x1, // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    false,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );
  methodsMetadata.insert_or_assign(cName, std::move(methodMetadata));
}

void JSFunctionsDecorator::registerAsyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();
  auto methodMetadata = std::make_shared<MethodMetadata>(
    cName,
    takesOwner &
    0x1, // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    true,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );
  methodsMetadata.insert_or_assign(cName, std::move(methodMetadata));
}

void JSFunctionsDecorator::decorate(
  jsi::Runtime &runtime,
  jsi::Object &jsObject
) {
  for (auto &[name, method]: this->methodsMetadata) {
    jsObject.setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::Value(runtime, *method->toJSFunction(runtime))
    );
  }
}

} // namespace expo
