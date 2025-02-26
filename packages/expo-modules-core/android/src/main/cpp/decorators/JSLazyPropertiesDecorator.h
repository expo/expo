// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include <fbjni/fbjni.h>

#include <unordered_map>

#include "../JNIFunctionBody.h"
#include "../types/ExpectedType.h"
#include "JSDecorator.h"

namespace jni = facebook::jni;

namespace expo {

class JSLazyPropertiesDecorator : public JSDecorator {
public:
  void registerLazyProperty(
    jni::alias_ref<jstring> name,
    jni::alias_ref<JNINoArgsFunctionBody::javaobject> getter
  );

  void decorate(
    jsi::Runtime &runtime,
    jsi::Object &jsObject
  ) override;

private:
  /**
  * A registry of lazy properties
  * The MethodMetadata points to the getter.
  */
  std::unordered_map<std::string, jni::global_ref<JNINoArgsFunctionBody::javaobject>> lazyProperties;
};

}
