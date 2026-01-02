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
#include "JSOptimizedFunctionsDecorator.h"

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

  void registerConstant(
    jni::alias_ref<jstring> name,
    jni::alias_ref<JNINoArgsFunctionBody::javaobject> getter
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
    jni::alias_ref<JSDecoratorsBridgingObject::javaobject> jsDecoratorsConstructor,
    jboolean takesOwner,
    jni::alias_ref<jclass> ownerClass,
    jboolean isSharedRef,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> body
  );

  /**
   * Register an optimized function using JNI reflection (no generated C++ code needed).
   * @param name The JavaScript function name
   * @param methodName The Kotlin method name
   * @param moduleInstance The module instance to call the method on
   * @param jniSignature The JNI method signature (e.g., "(DD)D")
   * @param paramTypes Array of parameter type codes ("D", "I", "Z", etc.)
   * @param returnType Return type code ("D", "I", "Z", "V", etc.)
   */
  void registerOptimizedSyncFunction(
    jni::alias_ref<jstring> name,
    jni::alias_ref<jstring> methodName,
    jni::alias_ref<jobject> moduleInstance,
    jni::alias_ref<jstring> jniSignature,
    jni::alias_ref<jni::JArrayClass<jstring>::javaobject> paramTypes,
    jni::alias_ref<jstring> returnType
  );

  /**
   * Converts and consume all registered java decorators to C++
   * @return vector of unique pointers to decorators
   */
  std::vector<std::unique_ptr<JSDecorator>> bridge();

private:
  friend HybridBase;

  static JNIType stringToJNIType(const std::string& typeStr);

  std::unique_ptr<JSFunctionsDecorator> functionDecorator;
  std::unique_ptr<JSConstantsDecorator> constantsDecorator;
  std::unique_ptr<JSPropertiesDecorator> propertiesDecorator;
  std::unique_ptr<JSObjectDecorator> objectDecorator;
  std::unique_ptr<JSClassesDecorator> classDecorator;
  std::unique_ptr<JSOptimizedFunctionsDecorator> optimizedFunctionDecorator;
};

} // namespace expo
