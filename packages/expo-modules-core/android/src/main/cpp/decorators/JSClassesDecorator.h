// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>

#include <map>

#include "JSDecorator.h"
#include "../MethodMetadata.h"
#include "../JNIFunctionBody.h"
#include "JSIUtils.h"

namespace jni = facebook::jni;

namespace expo {

class JSDecoratorsBridgingObject;

class JSClassesDecorator : public JSDecorator {
public:
  void registerClass(
    jni::alias_ref<jstring> name,
    jni::alias_ref<jni::HybridClass<JSDecoratorsBridgingObject>::javaobject> prototypeDecorator,
    jboolean takesOwner,
    jni::alias_ref<jclass> ownerClass,
    jboolean isSharedRef,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> body
  );

  void decorate(
    jsi::Runtime &runtime,
    jsi::Object &jsObject
  ) override;

private:
  struct ClassEntry {
    std::vector<std::unique_ptr<JSDecorator>> prototypeDecorators;
    std::shared_ptr<MethodMetadata> constructor;
    jni::global_ref<jclass> ownerClass;
    bool isSharedRef;
  };

  static jsi::Function createClass(
    jsi::Runtime &runtime,
    const std::string &className,
    bool isSharedRef,
    common::ClassConstructor constructor
  );

  std::unordered_map<
    std::string,
    ClassEntry
  > classes;
};

} // namespace expo
