#pragma once

#include <memory>
#include <string>
#include <vector>

#ifdef ONANDROID
#include "TurboModule.h"
#else
#include <ReactCommon/TurboModule.h>
#endif

#include <ReactCommon/CallInvoker.h>

using namespace facebook;
using namespace react;

namespace devmenureanimated {

class JSI_EXPORT NativeReanimatedModuleSpec : public TurboModule {
 protected:
  explicit NativeReanimatedModuleSpec(std::shared_ptr<CallInvoker> jsInvoker);

 public:
  virtual void installCoreFunctions(
      jsi::Runtime &rt,
      const jsi::Value &valueSetter) = 0;

  // SharedValue
  virtual jsi::Value makeShareable(
      jsi::Runtime &rt,
      const jsi::Value &value) = 0;
  virtual jsi::Value makeMutable(jsi::Runtime &rt, const jsi::Value &value) = 0;
  virtual jsi::Value makeRemote(jsi::Runtime &rt, const jsi::Value &value) = 0;

  // mappers
  virtual jsi::Value startMapper(
      jsi::Runtime &rt,
      const jsi::Value &worklet,
      const jsi::Value &inputs,
      const jsi::Value &outputs,
      const jsi::Value &updater,
      const jsi::Value &viewDescriptors) = 0;
  virtual void stopMapper(jsi::Runtime &rt, const jsi::Value &mapperId) = 0;

  // events
  virtual jsi::Value registerEventHandler(
      jsi::Runtime &rt,
      const jsi::Value &eventHash,
      const jsi::Value &worklet) = 0;
  virtual void unregisterEventHandler(
      jsi::Runtime &rt,
      const jsi::Value &registrationId) = 0;

  // views
  virtual jsi::Value getViewProp(
      jsi::Runtime &rt,
      const jsi::Value &viewTag,
      const jsi::Value &propName,
      const jsi::Value &callback) = 0;

  // sensors
  virtual jsi::Value registerSensor(
      jsi::Runtime &rt,
      const jsi::Value &sensorType,
      const jsi::Value &interval,
      const jsi::Value &sensorDataContainer) = 0;
  virtual void unregisterSensor(
      jsi::Runtime &rt,
      const jsi::Value &sensorId) = 0;

  // keyboard
  virtual jsi::Value subscribeForKeyboardEvents(
      jsi::Runtime &rt,
      const jsi::Value &keyboardEventContainer) = 0;
  virtual void unsubscribeFromKeyboardEvents(
      jsi::Runtime &rt,
      const jsi::Value &listenerId) = 0;

  // other
  virtual jsi::Value enableLayoutAnimations(
      jsi::Runtime &rt,
      const jsi::Value &config) = 0;
  virtual jsi::Value configureProps(
      jsi::Runtime &rt,
      const jsi::Value &uiProps,
      const jsi::Value &nativeProps) = 0;
};

} // namespace devmenureanimated
