// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <vector>
#include <memory>

#include "decorators/JSDecorator.h"

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
class JSIContext;

class JavaScriptModuleObject;

class JSDecoratorsBridgingObject;

class JavaScriptRuntime;

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

  std::weak_ptr<jsi::Object> getCachedJSIObject();

  /**
   * Decorates the given object with properties and functions provided in the module definition.
   */
  void decorate(jni::alias_ref<jni::HybridClass<JSDecoratorsBridgingObject>::javaobject> jsDecoratorsBridgingObject) noexcept;

private:
  friend HybridBase;
  friend JavaScriptRuntime;

  /**
   * A reference to the `jsi::Object`.
   * Simple we cached that value to return the same object each time.
   * It's a weak reference because the JS runtime holds the actual object. 
   * Doing that allows the runtime to deallocate jsi::Object if it's not needed anymore.
   */
  std::weak_ptr<jsi::Object> jsiObject;

  std::vector<std::unique_ptr<JSDecorator>> decorators;
};
} // namespace expo
