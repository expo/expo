// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include <fbjni/fbjni.h>

#include <unordered_map>

#include "../MethodMetadata.h"
#include "../JNIFunctionBody.h"
#include "../types/ExpectedType.h"
#include "JSDecorator.h"

namespace jni = facebook::jni;

namespace expo {

class JSPropertiesDecorator : public JSDecorator {
public:
  void registerProperty(
    jni::alias_ref<jstring> name,
    jboolean getterTakesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> getterExpectedArgsTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> getter,
    jboolean setterTakesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> setterExpectedArgsTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> setter
  );

  void decorate(
    jsi::Runtime &runtime,
    jsi::Object &jsObject
  ) override;

private:
  /**
  * A registry of properties
  * The first MethodMetadata points to the getter and the second one to the setter.
  */
  std::unordered_map<std::string, std::pair<std::shared_ptr<MethodMetadata>, std::shared_ptr<MethodMetadata>>> properties;
};

}
