// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <ReactCommon/CallInvoker.h>

namespace expo {

/**
 * Dummy CallInvoker that invokes everything immediately.
 * Used in the test environment to check the async flow.
 */
class TestingSyncJSCallInvoker : public facebook::react::CallInvoker {
public:
  TestingSyncJSCallInvoker(std::shared_ptr<jsi::Runtime> runtime) : runtime(runtime) {}

#if REACT_NATIVE_TARGET_VERSION >= 75
  void invokeAsync(react::CallFunc &&func) noexcept override {
    func(*runtime);
  }

  void invokeSync(react::CallFunc &&func) override {
    func(*runtime);
  }
#else
  void invokeAsync(std::function<void()> &&func) noexcept override {
    func();
  }

  void invokeSync(std::function<void()> &&func) override {
    func();
  }
#endif

  ~TestingSyncJSCallInvoker() override = default;

  std::shared_ptr<jsi::Runtime> runtime;
};

} // namespace expo

#endif // __cplusplus
