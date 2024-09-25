// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>

#include <vector>

#include "JSDecorator.h"
#include "../MethodMetadata.h"
#include "../JNIFunctionBody.h"
#include "../types/ExpectedType.h"

#include "JSFunctionsDecorator.h"
#include "JSPropertiesDecorator.h"
#include "JSConstantsDecorator.h"
#include "JSObjectDecorator.h"
#include "JSClassesDecorator.h"

namespace jni = facebook::jni;

namespace expo {

class JSDecoratorsBridgingObject : public jni::HybridClass<JSDecoratorsBridgingObject> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/decorators/JSDecoratorsBridgingObject;";
  static auto constexpr TAG = "JSDecoratorsBridgingObject";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

  static void registerNatives();

  void registerProperty(
    jni::alias_ref<jstring> name,
    jboolean getterTakesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> getterExpectedArgsTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> getter,
    jboolean setterTakesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> setterExpectedArgsTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> setter
  );

  void registerSyncFunction(
    jni::alias_ref<jstring> name,
    jboolean takesOwner,
    jboolean enumerable,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> body
  );

  void registerAsyncFunction(
    jni::alias_ref<jstring> name,
    jboolean takesOwner,
    jboolean enumerable,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
  );

  void registerConstants(jni::alias_ref<react::NativeMap::javaobject> constants);

  void registerObject(
    jni::alias_ref<jstring> name,
    jni::alias_ref<JSDecoratorsBridgingObject::javaobject> jsDecoratorsBridgingObject
  );

  void registerClass(
    jni::alias_ref<jstring> name,
    jni::alias_ref<JSDecoratorsBridgingObject::javaobject> jsDecoratorsBridgingObject,
    jboolean takesOwner,
    jni::alias_ref<jclass> ownerClass,
    jboolean isSharedRef,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> body
  );

  /**
   * Converts and consume all registered java decorators to C++
   * @return vector of unique pointers to decorators
   */
  std::vector<std::unique_ptr<JSDecorator>> bridge();

private:
  friend HybridBase;

  std::unique_ptr<JSFunctionsDecorator> functionDecorator;
  std::unique_ptr<JSConstantsDecorator> constantsDecorator;
  std::unique_ptr<JSPropertiesDecorator> propertiesDecorator;
  std::unique_ptr<JSObjectDecorator> objectDecorator;
  std::unique_ptr<JSClassesDecorator> classDecorator;
};

} // namespace expo
