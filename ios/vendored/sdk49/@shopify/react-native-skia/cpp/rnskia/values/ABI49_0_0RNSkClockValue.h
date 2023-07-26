
#pragma once

#include "ABI49_0_0RNSkPlatformContext.h"
#include "ABI49_0_0RNSkReadonlyValue.h"
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include <algorithm>
#include <chrono>
#include <functional>
#include <memory>

namespace ABI49_0_0RNSkia {
namespace jsi = ABI49_0_0facebook::jsi;
/**
 Implements a readonly Value that is updated every time the screen is redrawn.
 Its value will be the number of milliseconds since the animation value was
 started.
 */
class ABI49_0_0RNSkClockValue : public ABI49_0_0RNSkReadonlyValue {
  enum ABI49_0_0RNSkClockState { NotStarted = 0, Running = 1, Stopped = 2 };

public:
  ABI49_0_0RNSkClockValue(std::shared_ptr<ABI49_0_0RNSkPlatformContext> platformContext,
                 size_t identifier, jsi::Runtime &runtime,
                 const jsi::Value *arguments, size_t count)
      : ABI49_0_0RNSkReadonlyValue(platformContext), _runtime(runtime),
        _identifier(identifier) {
    // Start by updating to zero (start value)
    update(_runtime, static_cast<double>(0));
  }

  virtual ~ABI49_0_0RNSkClockValue() { stopClock(); }

  JSI_HOST_FUNCTION(start) {
    startClock();
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(stop) {
    stopClock();
    return jsi::Value::undefined();
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(ABI49_0_0RNSkReadonlyValue, addListener),
                       JSI_EXPORT_FUNC(ABI49_0_0RNSkClockValue, start),
                       JSI_EXPORT_FUNC(ABI49_0_0RNSkClockValue, stop))

  virtual void startClock() {
    if (_state == ABI49_0_0RNSkClockState::Running) {
      return;
    }

    auto now = std::chrono::high_resolution_clock::now();
    if (_state == ABI49_0_0RNSkClockState::NotStarted) {
      _start = now;
      _stop = now;
    }

    // Subtract pause time from start
    auto timeSinceStop = now - _stop;
    _start += timeSinceStop;

    _state = ABI49_0_0RNSkClockState::Running;

    getContext()->beginDrawLoop(
        _identifier, [weakSelf = weak_from_this()](bool invalidated) {
          auto self = weakSelf.lock();
          if (self) {
            std::dynamic_pointer_cast<ABI49_0_0RNSkClockValue>(self)->notifyUpdate(
                invalidated);
          }
        });
  }

  virtual void stopClock() {
    if (_state == ABI49_0_0RNSkClockState::Running) {
      _state = ABI49_0_0RNSkClockState::Stopped;
      _stop = std::chrono::high_resolution_clock::now();
      getContext()->endDrawLoop(_identifier);
    }
  }

protected:
  virtual void tick(jsi::Runtime &runtime, const jsi::Value &value) {
    ABI49_0_0RNSkClockValue::update(runtime, value);
  }

  void notifyUpdate(bool invalidated) {
    if (invalidated) {
      stopClock();
      return;
    }

    if (_state != ABI49_0_0RNSkClockState::Running) {
      return;
    }

    // Ensure we call any updates from the draw loop on the javascript thread
    getContext()->runOnJavascriptThread(
        // To ensure that this shared_ptr instance is not deallocated before we
        // are done running the update lambda we pass a shared from this to the
        // lambda scope.
        [weakSelf = weak_from_this()]() {
          auto self = weakSelf.lock();
          if (self) {
            auto selfClockValue =
                std::dynamic_pointer_cast<ABI49_0_0RNSkClockValue>(self);
            if (selfClockValue->getState() == ABI49_0_0RNSkClockState::Running) {
              auto now = std::chrono::high_resolution_clock::now();
              auto deltaFromStart =
                  std::chrono::duration_cast<std::chrono::milliseconds>(
                      now - selfClockValue->_start)
                      .count();
              selfClockValue->tick(selfClockValue->_runtime,
                                   static_cast<double>(deltaFromStart));
            }
          }
        });
  }

  /**
   Returns the draw identifier for the clock. This identifier is used
   for the draw loop.
   */
  size_t getIdentifier() { return _identifier; }

  /**
   Returns the state of the clock
   */
  ABI49_0_0RNSkClockState getState() { return _state; }

  jsi::Runtime &_runtime;
  size_t _identifier;
  std::chrono::time_point<std::chrono::steady_clock> _start;
  std::chrono::time_point<std::chrono::steady_clock> _stop;
  std::atomic<ABI49_0_0RNSkClockState> _state = {ABI49_0_0RNSkClockState::NotStarted};
};

} // namespace ABI49_0_0RNSkia
