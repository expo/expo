// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#include "CallbackContext.h"

namespace expo {

CallbackContext::CallbackContext(
  jsi::Runtime &rt,
  std::weak_ptr<react::CallInvoker> jsCallInvokerHolder,
  std::optional<jsi::Function> resolveHolder,
  std::optional<jsi::Function> rejectHolder
) : react::LongLivedObject(rt),
    rt(rt),
    jsCallInvokerHolder(std::move(jsCallInvokerHolder)),
    resolveHolder(std::move(resolveHolder)),
    rejectHolder(std::move(rejectHolder)) {}

void CallbackContext::invalidate() {
  resolveHolder.reset();
  rejectHolder.reset();
  allowRelease();
}

void scheduleOnJSThread(const std::weak_ptr<CallbackContext> &context, JSThreadTask &&task) {
  const auto strongContext = context.lock();
  // The context was deallocated before the callback was invoked.
  if (strongContext == nullptr) {
    return;
  }

  const auto jsInvoker = strongContext->jsCallInvokerHolder.lock();
  // Call invoker is already released, so we cannot invoke the callback.
  if (jsInvoker == nullptr) {
    return;
  }

  jsInvoker->invokeAsync(
    [context, task = std::move(task)]() -> void {
      auto strongContext = context.lock();
      if (strongContext == nullptr) {
        return;
      }
      task(strongContext->rt, *strongContext);
    });
}

} // namespace expo
