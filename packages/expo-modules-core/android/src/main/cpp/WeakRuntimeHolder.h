// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jsi/jsi.h>

#include <memory>

namespace expo {

namespace jsi = facebook::jsi;

class JavaScriptRuntime;

/**
 * A convenient class to access underlying jni::Runtime and hold a weak reference to expo::JavaScriptRuntime.
 * It's working like std::weak_ptr but can have more helper methods.
 */
class WeakRuntimeHolder : public std::weak_ptr<JavaScriptRuntime> {
public:
  WeakRuntimeHolder() = default;

  WeakRuntimeHolder(WeakRuntimeHolder const &) = default;

  WeakRuntimeHolder(WeakRuntimeHolder &&) = default;

  WeakRuntimeHolder(std::weak_ptr<JavaScriptRuntime> runtime);

  /**
   * @return an reference to the jsi::Runtime.
   */
  jsi::Runtime &getJSRuntime();

  void ensureRuntimeIsValid();
};
} // namespace expo
