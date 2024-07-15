// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSPropertiesDecorator.h"
#include "../JavaScriptObject.h"
#include "JSIUtils.h"


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

  auto getterMetadata = make_shared<MethodMetadata>(
    cName,
    getterTakesOwner &
    0x1, // We're unsure if getterTakesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    false,
    jni::make_local(getterExpectedArgsTypes),
    jni::make_global(getter)
  );

  auto setterMetadata = make_shared<MethodMetadata>(
    cName,
    setterTakesOwner &
    0x1, // We're unsure if setterTakesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    false,
    jni::make_local(setterExpectedArgsTypes),
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
    descriptor.setProperty(
      runtime,
      "get",
      jsi::Value(runtime, *getter->toJSFunction(runtime))
    );
    descriptor.setProperty(
      runtime,
      "set",
      jsi::Value(runtime, *setter->toJSFunction(runtime))
    );
    common::defineProperty(runtime, &jsObject, name.c_str(), std::move(descriptor));
  }
}

} // namespace expo
