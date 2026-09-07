// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "ExpoHeader.pch"

#include <ReactCommon/CallInvoker.h>
#include <react/bridging/LongLivedObject.h>

#include <functional>
#include <memory>
#include <optional>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

/**
 * State shared by every native-to-JS callback: the runtime, the call invoker that hops onto the
 * JS thread, and the JS functions to call. Registered in the runtime's `LongLivedObjectCollection`
 * so a runtime teardown invalidates it before the runtime is destroyed.
 *
 * `resolveHolder` is the primary function. `rejectHolder` is only set for promise callbacks.
 */
class CallbackContext : public react::LongLivedObject {
public:
  CallbackContext(
    jsi::Runtime &rt,
    std::weak_ptr<react::CallInvoker> jsCallInvokerHolder,
    std::optional<jsi::Function> resolveHolder,
    std::optional<jsi::Function> rejectHolder
  );

  jsi::Runtime &rt;
  std::weak_ptr<react::CallInvoker> jsCallInvokerHolder;
  std::optional<jsi::Function> resolveHolder;
  std::optional<jsi::Function> rejectHolder;

  void invalidate();
};

using JSThreadTask = std::function<void(jsi::Runtime &rt, CallbackContext &context)>;

/**
 * Posts `task` onto the JS thread through the context's call invoker.
 * Does nothing when the context or the invoker is already gone.
 */
void scheduleOnJSThread(const std::weak_ptr<CallbackContext> &context, JSThreadTask &&task);

} // namespace expo
