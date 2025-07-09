// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <ReactCommon/CallInvoker.h>

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

/**
 * Dummy CallInvoker that invokes everything immediately.
 * Used in the test environment to check the async flow.
 */
class TestingSyncJSCallInvoker : public react::CallInvoker {
public:
  explicit TestingSyncJSCallInvoker(const std::shared_ptr<jsi::Runtime>& runtime) : runtime(runtime) {}

  void invokeAsync(react::CallFunc &&func) noexcept override {
    func(*runtime.lock());
  }

  void invokeSync(react::CallFunc &&func) override {
    func(*runtime.lock());
  }

  ~TestingSyncJSCallInvoker() override = default;

  std::weak_ptr<jsi::Runtime> runtime;
};

} // namespace expo

#endif // __cplusplus
