// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <ReactCommon/CallInvoker.h>
#include <ExpoModulesCore/MainThreadInvoker.h>

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

/**
 * Dummy CallInvoker.
 * Async functions are invoked on the main thread on iOS.
 * Used in the test environment to check the async flow.
 */
class TestingJSCallInvoker : public react::CallInvoker {
public:
  explicit TestingJSCallInvoker(const std::shared_ptr<jsi::Runtime>& runtime) : runtime(runtime) {}

  void invokeAsync(react::CallFunc &&func) noexcept override {
    auto weakRuntime = runtime;
    std::function<void()> mainThreadFunc = [weakRuntime, func]() {
      auto strongRuntime = weakRuntime.lock();
      func(*strongRuntime);
    };
    MainThreadInvoker::invokeOnMainThread(mainThreadFunc);
  }

  void invokeSync(react::CallFunc &&func) override {
    func(*runtime.lock());
  }

  ~TestingJSCallInvoker() override = default;

  std::weak_ptr<jsi::Runtime> runtime;
};

} // namespace expo

#endif // __cplusplus
