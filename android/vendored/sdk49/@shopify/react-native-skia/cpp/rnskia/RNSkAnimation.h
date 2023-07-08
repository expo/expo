#pragma once

#include <array>
#include <memory>

#include "JsiHostObject.h"
#include "RNSkClockValue.h"
#include "RNSkPlatformContext.h"
#include <jsi/jsi.h>

namespace RNSkia {
namespace jsi = facebook::jsi;

/**
 Implements an animation that can be used to drive other values
 */
class RNSkAnimation : public RNSkClockValue {

public:
  RNSkAnimation(std::shared_ptr<RNSkPlatformContext> platformContext,
                size_t identifier, jsi::Runtime &runtime,
                const jsi::Value *arguments, size_t count)
      : RNSkClockValue(platformContext, identifier, runtime, arguments, count) {
    // Save the update function
    _updateFunction = std::make_shared<jsi::Function>(
        arguments[0].asObject(runtime).asFunction(runtime));

    // Set state to undefined initially.
    _args[1] = jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(cancel) {
    stopClock();
    return jsi::Value::undefined();
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(RNSkAnimation, cancel))

protected:
  void tick(jsi::Runtime &runtime, const jsi::Value &value) override {
    // Set up arguments and call the update function
    _args[0] = value.asNumber();
    _args[1] = _updateFunction->call(
        runtime, static_cast<const jsi::Value *>(_args.data()), _args.size());

    // Get finished
    auto finished =
        _args[1].asObject(runtime).getProperty(runtime, "finished").getBool();
    if (finished) {
      stopClock();
    }

    // Get the next value
    auto nextValue =
        _args[1].asObject(runtime).getProperty(runtime, "current").asNumber();

    // Update self
    update(runtime, nextValue);
  }

private:
  std::shared_ptr<jsi::Function> _updateFunction;
  std::array<jsi::Value, 2> _args;
};
} // namespace RNSkia
