#pragma once

#include "../ExpoHeader.pch"

#if WORKLETS_ENABLED

#include <ReactCommon/CallInvoker.h>

#include <worklets/WorkletRuntime/WorkletRuntime.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

class WorkletJSCallInvoker : public react::CallInvoker {
public:
  explicit WorkletJSCallInvoker(std::weak_ptr<worklets::WorkletRuntime> &workletRuntimeHolder);

  void invokeAsync(react::CallFunc &&func) noexcept override;

  void invokeSync(react::CallFunc &&func) override;
private:
  std::weak_ptr<worklets::WorkletRuntime> workletRuntimeHolder_;
};

} // namespace expo

#endif
