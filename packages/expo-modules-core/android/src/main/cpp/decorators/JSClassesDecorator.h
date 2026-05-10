// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "../ExpoHeader.pch"

#include "JSDecorator.h"
#include "../MethodMetadata.h"
#include "../JNIFunctionBody.h"
#include "JSIUtils.h"

namespace jni = facebook::jni;

namespace expo {

class JSDecoratorsBridgingObject;

/**
 * NativeState attached to the class prototype in the worklet runtime.
 * Owns the decorators (and their MethodMetadata shared_ptrs) so that the
 * weak_ptrs captured by prototype host functions stay valid.
 * Released automatically when the prototype is garbage-collected.
 */
struct ClassPrototypeState : public jsi::NativeState {
  std::vector<std::unique_ptr<JSDecorator>> prototypeDecorators;
  std::vector<std::unique_ptr<JSDecorator>> constructorDecorators;
  std::shared_ptr<MethodMetadata> constructor;
};

class JSClassesDecorator : public JSDecorator {
public:
  void registerClass(
    jni::alias_ref<jstring> name,
    jni::alias_ref<jni::HybridClass<JSDecoratorsBridgingObject>::javaobject> prototypeDecorator,
    jni::alias_ref<jni::HybridClass<JSDecoratorsBridgingObject>::javaobject> constructorDecorator,
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

  /**
   * Worklet runtime path - installs classes in classRegistry, transfers
   * decorator ownership to each prototype via NativeState, and drains this
   * decorator. Must only be called once.
   */
  void consumeForWorklet(jsi::Runtime &runtime);

private:
  struct ClassEntry {
    std::vector<std::unique_ptr<JSDecorator>> prototypeDecorators;
    std::vector<std::unique_ptr<JSDecorator>> constructorDecorators;
    std::shared_ptr<MethodMetadata> constructor;
    jni::global_ref<jclass> ownerClass;
    bool isSharedRef;
  };

  std::shared_ptr<jsi::Function> installClass(
    jsi::Runtime &runtime,
    const std::string &name,
    ClassEntry &classInfo
  );

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
