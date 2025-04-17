// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <ReactCommon/CallInvoker.h>
#include "MainThreadInvoker.h"

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

/**
 * Dummy CallInvoker.
 * Used in the test environment to check the async flow.
 */
class TestingJSCallInvoker : public react::CallInvoker {
public:
  explicit TestingJSCallInvoker(const std::shared_ptr<jsi::Runtime>& runtime) : runtime(runtime) {}

#if REACT_NATIVE_TARGET_VERSION >= 75
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
#else
  void invokeAsync(react::CallFunc &&func) noexcept override {
    std::function<void()> mainThreadFunc = [func]() {
      func();
    };
    MainThreadInvoker::invokeOnMainThread(mainThreadFunc);
  }

  void invokeSync(std::function<void()> &&func) override {
    func();
  }
#endif

  ~TestingJSCallInvoker() override = default;

  std::weak_ptr<jsi::Runtime> runtime;
};

} // namespace expo

#endif // __cplusplus
