// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSFunctionsDecorator.h"
#include "JSIUtils.h"

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

std::vector<std::unique_ptr<AnyType>> JSFunctionsDecorator::mapConverters(
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes
) {
  size_t argsSize = expectedArgTypes->size();
  std::vector<std::unique_ptr<AnyType>> argTypes;
  argTypes.reserve(argsSize);
  for (size_t i = 0; i < argsSize; i++) {
    auto expectedType = expectedArgTypes->getElement(i);
    argTypes.push_back(
      std::make_unique<AnyType>(std::move(expectedType))
    );
  }
  return argTypes;
}

void JSFunctionsDecorator::registerFunction(
  const std::string &name,
  bool takesOwner,
  bool enumerable,
  bool isAsync,
  std::vector<std::unique_ptr<AnyType>> &&argTypes,
  jni::global_ref<jobject> body
) {
  MethodMetadata::Info info{
    .name = name,
    .takesOwner = takesOwner,
    .isAsync = isAsync,
    .enumerable = enumerable,
    .argTypes = std::move(argTypes)
  };
  auto methodMetadata = std::make_shared<MethodMetadata>(
    std::move(info),
    std::move(body)
  );
  methodsMetadata.insert_or_assign(name, std::move(methodMetadata));
}

void JSFunctionsDecorator::registerSyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jboolean enumerable,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  registerFunction(
    name->toStdString(),
    static_cast<bool>(
      takesOwner & 0x1
    ), // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    enumerable,
    /*isAsync=*/false,
    mapConverters(expectedArgTypes),
    jni::make_global(body)
  );
}

void JSFunctionsDecorator::registerAsyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jboolean enumerable,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
) {
  registerFunction(
    name->toStdString(),
    static_cast<bool>(
      takesOwner & 0x1
    ), // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    enumerable,
    /*isAsync=*/true,
    mapConverters(expectedArgTypes),
    jni::make_global(body)
  );
}

void JSFunctionsDecorator::decorate(
  jsi::Runtime &runtime,
  jsi::Object &jsObject
) {
  for (auto &[name, method]: this->methodsMetadata) {
    if (method->info.enumerable) {
      jsObject.setProperty(
        runtime,
        jsi::String::createFromUtf8(runtime, name),
        jsi::Value(runtime, *method->toJSFunction(runtime))
      );
    } else {
      common::PropertyDescriptor descriptor{
        .enumerable = false,
        .value = jsi::Value(runtime, *method->toJSFunction(runtime))
      };

      defineProperty(runtime, &jsObject, name.c_str(), descriptor);
    }
  }
}

} // namespace expo
