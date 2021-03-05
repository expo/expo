#pragma once

#include <memory>
#include <string>
#include <vector>

#ifdef ONANDROID
  #include "ABI40_0_0TurboModule.h"
#else
  #include <ABI40_0_0ReactCommon/ABI40_0_0TurboModule.h>
#endif

#include <ABI40_0_0ReactCommon/ABI40_0_0CallInvoker.h>

using namespace ABI40_0_0facebook;
using namespace ABI40_0_0React;

namespace ABI40_0_0reanimated
{

class JSI_EXPORT ABI40_0_0NativeReanimatedModuleSpec : public TurboModule {
 protected:
  ABI40_0_0NativeReanimatedModuleSpec(std::shared_ptr<CallInvoker> jsInvoker);

 public:
  virtual void installCoreFunctions(jsi::Runtime &rt, const jsi::Value &valueSetter) = 0;

  // SharedValue
  virtual jsi::Value makeShareable(jsi::Runtime &rt, const jsi::Value &value) = 0;
  virtual jsi::Value makeMutable(jsi::Runtime &rt, const jsi::Value &value) = 0;
  virtual jsi::Value makeRemote(jsi::Runtime &rt, const jsi::Value &value) = 0;

  // mappers
  virtual jsi::Value startMapper(jsi::Runtime &rt, const jsi::Value &worklet, const jsi::Value &inputs, const jsi::Value &outputs) = 0;
  virtual void stopMapper(jsi::Runtime &rt, const jsi::Value &mapperId) = 0;

  // events
  virtual jsi::Value registerEventHandler(jsi::Runtime &rt, const jsi::Value &eventHash, const jsi::Value &worklet) = 0;
  virtual void unregisterEventHandler(jsi::Runtime &rt, const jsi::Value &registrationId) = 0;

  // views
  virtual jsi::Value getViewProp(jsi::Runtime &rt, const jsi::Value &viewTag, const jsi::Value &propName, const jsi::Value &callback) = 0;
};

} // namespace ABI40_0_0reanimated
