// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/ReadableNativeMap.h>
#include <jni/JCallback.h>

#include <unordered_map>

#include "MethodMetadata.h"
#include "JNIFunctionBody.h"
#include "types/ExpectedType.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {
class JSIContext;

class JavaScriptModuleObject;

void decorateObjectWithFunctions(
  jsi::Runtime &runtime,
  jsi::Object *jsObject,
  JavaScriptModuleObject *objectData
);

void decorateObjectWithProperties(
  jsi::Runtime &runtime,
  jsi::Object *jsObject,
  JavaScriptModuleObject *objectData
);

void decorateObjectWithConstants(
  jsi::Runtime &runtime,
  jsi::Object *jsObject,
  JavaScriptModuleObject *objectData
);

/**
 * A CPP part of the module.
 *
 * Right now objects of this class are stored by the ModuleHolder to ensure they will live
 * as long as the RN context.
 */
class JavaScriptModuleObject : public jni::HybridClass<JavaScriptModuleObject> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptModuleObject;";
  static auto constexpr TAG = "JavaScriptModuleObject";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

  static void registerNatives();

  /**
   * Returns a cached instance of jsi::Object representing this module.
   * @param runtime
   * @return Wrapped instance of JavaScriptModuleObject::HostObject
   */
  std::shared_ptr<jsi::Object> getJSIObject(jsi::Runtime &runtime);

  /**
   * Decorates the given object with properties and functions provided in the module definition.
   */
  void decorate(jsi::Runtime &runtime, jsi::Object *moduleObject);

  /**
   * Exports constants that will be assigned to the underlying HostObject.
   */
  void exportConstants(jni::alias_ref<react::NativeMap::javaobject> constants);

  /**
   * Registers a sync function.
   * That function can be called via the `JavaScriptModuleObject.callSyncMethod` method.
   */
  void registerSyncFunction(
    jni::alias_ref<jstring> name,
    jboolean takesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> body
  );

  /**
   * Registers a async function.
   * That function can be called via the `JavaScriptModuleObject.callAsyncMethod` method.
   */
  void registerAsyncFunction(
    jni::alias_ref<jstring> name,
    jboolean takesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
  );

  void registerClass(
    jni::alias_ref<jstring> name,
    jni::alias_ref<JavaScriptModuleObject::javaobject> classObject,
    jboolean takesOwner,
    jni::alias_ref<jclass> ownerClass,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> body
  );

  void registerViewPrototype(
    jni::alias_ref<JavaScriptModuleObject::javaobject> viewPrototype
  );

  /**
   * Registers a property
   * @param name of the property
   * @param desiredType of the setter argument
   * @param getter body for the get method - can be nullptr
   * @param setter body for the set method - can be nullptr
   */
  void registerProperty(
    jni::alias_ref<jstring> name,
    jboolean getterTakesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> getterExpectedArgsTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> getter,
    jboolean setterTakesOwner,
    jni::alias_ref<jni::JArrayClass<ExpectedType>> setterExpectedArgsTypes,
    jni::alias_ref<JNIFunctionBody::javaobject> setter
  );

  /**
   * Emits an event using cached jsi::Object with the given name and body.
   * @param eventName
   * @param eventBody
   */
  void emitEvent(
    jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
    jni::alias_ref<jstring> eventName,
    jni::alias_ref<react::ReadableNativeMap::javaobject> eventBody
  );

private:
  friend HybridBase;

  friend void decorateObjectWithFunctions(
    jsi::Runtime &runtime,
    jsi::Object *jsObject,
    JavaScriptModuleObject *objectData
  );

  friend void decorateObjectWithProperties(
    jsi::Runtime &runtime,
    jsi::Object *jsObject,
    JavaScriptModuleObject *objectData
  );

  friend void decorateObjectWithConstants(
    jsi::Runtime &runtime,
    jsi::Object *jsObject,
    JavaScriptModuleObject *objectData
  );

  /**
   * A reference to the `jsi::Object`.
   * Simple we cached that value to return the same object each time.
   * It's a weak reference because the JS runtime holds the actual object. 
   * Doing that allows the runtime to deallocate jsi::Object if it's not needed anymore.
   */
  std::weak_ptr<jsi::Object> jsiObject;

  /**
   * Metadata map that stores information about all available methods on this module.
   */
  std::unordered_map<std::string, std::shared_ptr<MethodMetadata>> methodsMetadata;

  /**
   * A constants map.
   */
  std::unordered_map<std::string, folly::dynamic> constants;

  /**
   * A registry of properties
   * The first MethodMetadata points to the getter and the second one to the setter.
   */
  std::map<std::string, std::pair<std::shared_ptr<MethodMetadata>, std::shared_ptr<MethodMetadata>>> properties;

  std::map<
    std::string,
    std::tuple<jni::global_ref<JavaScriptModuleObject::javaobject>, std::shared_ptr<MethodMetadata>, jni::global_ref<jclass>>
  > classes;

  jni::global_ref<JavaScriptModuleObject::javaobject> viewPrototype;
};
} // namespace expo
