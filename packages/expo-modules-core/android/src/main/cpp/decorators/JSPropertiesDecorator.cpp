// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSPropertiesDecorator.h"
#include "../JavaScriptObject.h"
#include "JSIUtils.h"
#include "JSFunctionsDecorator.h"

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

void JSPropertiesDecorator::registerProperty(
  jni::alias_ref<jstring> name,
  jboolean getterTakesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> getterExpectedArgsTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> getter,
  jboolean setterTakesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> setterExpectedArgsTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> setter
) {
  auto cName = name->toStdString();
  MethodMetadata::Info getterInfo {
    .name = cName,
    // We're unsure if getterTakesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    .takesOwner = static_cast<bool>(getterTakesOwner & 0x1),
    .isAsync = false,
    .enumerable = true,
    .argTypes = JSFunctionsDecorator::mapConverters(getterExpectedArgsTypes)
  };
  auto getterMetadata = std::make_shared<MethodMetadata>(
    std::move(getterInfo),
    jni::make_global(getter)
  );

  MethodMetadata::Info setterInfo {
    .name = cName,
    // We're unsure if setterTakesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    .takesOwner = static_cast<bool>(setterTakesOwner & 0x1),
    .isAsync = false,
    .enumerable = true,
    .argTypes = JSFunctionsDecorator::mapConverters(setterExpectedArgsTypes)
  };
  auto setterMetadata = std::make_shared<MethodMetadata>(
    std::move(setterInfo),
    jni::make_global(setter)
  );

  auto functions = std::make_pair(
    std::move(getterMetadata),
    std::move(setterMetadata)
  );

  properties.insert_or_assign(cName, std::move(functions));
}

void JSPropertiesDecorator::decorate(
  jsi::Runtime &runtime,
  jsi::Object &jsObject
) {
  for (auto &[name, property]: this->properties) {
    auto &[getter, setter] = property;

    auto descriptor = JavaScriptObject::preparePropertyDescriptor(runtime,
                                                                  1 << 1 /* enumerable */);
    auto jsGetter = getter->toJSFunction(runtime);
    if (jsGetter != nullptr) {
      descriptor.setProperty(
        runtime,
        "get",
        jsi::Value(runtime, *jsGetter)
      );
    }

    auto jsSetter = setter->toJSFunction(runtime);
    if (jsSetter != nullptr) {
      descriptor.setProperty(
        runtime,
        "set",
        jsi::Value(runtime, *jsSetter)
      );
    }
    common::defineProperty(runtime, &jsObject, name.c_str(), std::move(descriptor));
  }
}

} // namespace expo
