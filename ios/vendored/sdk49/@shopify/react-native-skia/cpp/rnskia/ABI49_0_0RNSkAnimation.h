#pragma once

#include <array>
#include <memory>

#include "JsiHostObject.h"
#include "ABI49_0_0RNSkClockValue.h"
#include "ABI49_0_0RNSkPlatformContext.h"
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

namespace ABI49_0_0RNSkia {
namespace jsi = ABI49_0_0facebook::jsi;

/**
 Implements an animation that can be used to drive other values
 */
class ABI49_0_0RNSkAnimation : public ABI49_0_0RNSkClockValue {

public:
  ABI49_0_0RNSkAnimation(std::shared_ptr<ABI49_0_0RNSkPlatformContext> platformContext,
                size_t identifier, jsi::Runtime &runtime,
                const jsi::Value *arguments, size_t count)
      : ABI49_0_0RNSkClockValue(platformContext, identifier, runtime, arguments, count) {
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

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(ABI49_0_0RNSkAnimation, cancel))

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
} // namespace ABI49_0_0RNSkia
