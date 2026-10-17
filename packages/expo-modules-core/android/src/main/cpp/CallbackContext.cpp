// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#include "CallbackContext.h"
#include "JSIContext.h"

namespace expo {

std::shared_ptr<CallbackContext> CallbackContext::create(
  jsi::Runtime &rt,
  std::optional<jsi::Function> resolveHolder,
  std::optional<jsi::Function> rejectHolder,
  std::vector<jsi::Value> retainedValues
) {
  auto context = std::make_shared<CallbackContext>(
    rt,
    getJSIContext(rt)->runtimeHolder->jsInvoker,
    std::move(resolveHolder),
    std::move(rejectHolder),
    std::move(retainedValues)
  );
  react::LongLivedObjectCollection::get(rt).add(context);
  return context;
}

CallbackContext::CallbackContext(
  jsi::Runtime &rt,
  std::weak_ptr<react::CallInvoker> jsCallInvokerHolder,
  std::optional<jsi::Function> resolveHolder,
  std::optional<jsi::Function> rejectHolder,
  std::vector<jsi::Value> retainedValues
) : react::LongLivedObject(rt),
    rt(rt),
    jsCallInvokerHolder(std::move(jsCallInvokerHolder)),
    resolveHolder(std::move(resolveHolder)),
    rejectHolder(std::move(rejectHolder)),
    retainedValues(std::move(retainedValues)) {}

void CallbackContext::invalidate() {
  resolveHolder.reset();
  rejectHolder.reset();
  retainedValues.clear();
  allowRelease();
}

void CallbackContext::schedule(const std::weak_ptr<CallbackContext> &context, Task &&task) {
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
      task(*strongContext);
    });
}

} // namespace expo
