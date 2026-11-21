// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "ExpoHeader.pch"

#include <ReactCommon/CallInvoker.h>
#include <react/bridging/LongLivedObject.h>

#include <functional>
#include <memory>
#include <optional>
#include <vector>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

/**
 * State shared by every native-to-JS callback: the runtime, the call invoker that hops onto the
 * JS thread, and the JS functions to call. Registered in the runtime's `LongLivedObjectCollection`
 * so a runtime teardown releases it before the runtime is destroyed.
 *
 * `resolveHolder` is the primary function. `rejectHolder` is only set for promise callbacks.
 */
class CallbackContext : public react::LongLivedObject {
public:
  using Task = std::function<void(CallbackContext &context)>;

  /**
   * Creates a context and registers it in the runtime's `LongLivedObjectCollection`.
   */
  static std::shared_ptr<CallbackContext> create(
    jsi::Runtime &rt,
    std::optional<jsi::Function> resolveHolder,
    std::optional<jsi::Function> rejectHolder,
    std::vector<jsi::Value> retainedValues = {}
  );

  /**
   * Posts `task` onto the JS thread through the context's call invoker.
   * Does nothing when the context or the invoker is already gone.
   */
  static void schedule(const std::weak_ptr<CallbackContext> &context, Task &&task);

  CallbackContext(
    jsi::Runtime &rt,
    std::weak_ptr<react::CallInvoker> jsCallInvokerHolder,
    std::optional<jsi::Function> resolveHolder,
    std::optional<jsi::Function> rejectHolder,
    std::vector<jsi::Value> retainedValues = {}
  );

  jsi::Runtime &rt;
  std::weak_ptr<react::CallInvoker> jsCallInvokerHolder;
  std::optional<jsi::Function> resolveHolder;
  std::optional<jsi::Function> rejectHolder;
  /**
   * JS values that have to stay alive until the callback is invalidated.
   */
  std::vector<jsi::Value> retainedValues;

  void invalidate();
};

} // namespace expo
