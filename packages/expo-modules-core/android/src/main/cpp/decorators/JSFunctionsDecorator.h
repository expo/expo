// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <unordered_map>
#include <memory>

#include "JSDecorator.h"
#include "../MethodMetadata.h"
#include "../JNIFunctionBody.h"
#include "../types/ExpectedType.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

class JSFunctionsDecorator : public JSDecorator {
public:

  void registerSyncFunction(
    jni::alias_ref<jstring> name,
    jboolean takesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> body
  );

  void registerAsyncFunction(
    jni::alias_ref<jstring> name,
    jboolean takesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
  );

  void decorate(
    jsi::Runtime &runtime,
    jsi::Object &jsObject
  ) override;

private:
  /**
  * Metadata map that stores information about all available methods on this module.
  */
  std::unordered_map<std::string, std::shared_ptr<MethodMetadata>> methodsMetadata;
};

}
