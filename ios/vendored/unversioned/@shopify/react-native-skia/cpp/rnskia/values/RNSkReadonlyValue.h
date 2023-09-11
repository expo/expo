
#pragma once

#include <algorithm>
#include <chrono>
#include <functional>
#include <memory>
#include <unordered_map>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "JsiValueWrapper.h"
#include "RNSkPlatformContext.h"

namespace RNSkia {
namespace jsi = facebook::jsi;

/**
 Implements a readonly Value that is updated every time the screen is redrawn.
 Its value will be the number of milliseconds since the animation value was
 started.
 */
class RNSkReadonlyValue
    : public JsiSkHostObject,
      public std::enable_shared_from_this<RNSkReadonlyValue> {
public:
  explicit RNSkReadonlyValue(
      std::shared_ptr<RNSkPlatformContext> platformContext)
      : JsiSkHostObject(platformContext),
        _valueHolder(std::make_shared<RNJsi::JsiValueWrapper>(
            *platformContext->getJsRuntime())) {}

  virtual ~RNSkReadonlyValue() { invalidate(); }

  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "RNSkValue");
  }

  JSI_PROPERTY_GET(current) { return getCurrent(runtime); }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(RNSkReadonlyValue,
                                                  __typename__),
                              JSI_EXPORT_PROP_GET(RNSkReadonlyValue, current))

  JSI_HOST_FUNCTION(addListener) {
    if (!arguments[0].isObject() ||
        !arguments[0].asObject(runtime).isFunction(runtime)) {
      throw jsi::JSError(runtime, "Expected function as first parameter.");
      return jsi::Value::undefined();
    }
    auto callback = std::make_shared<jsi::Function>(
        arguments[0].asObject(runtime).asFunction(runtime));

    auto unsubscribe =
        addListener([weakSelf = weak_from_this(),
                     callback = std::move(callback)](jsi::Runtime &runtime) {
          auto self = weakSelf.lock();
          if (self) {
            auto selfReadonlyValue =
                std::dynamic_pointer_cast<RNSkReadonlyValue>(self);
            callback->call(runtime, selfReadonlyValue->get_current(runtime));
          }
        });

    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "unsubscribe"), 0,
        JSI_HOST_FUNCTION_LAMBDA {
          unsubscribe();
          return jsi::Value::undefined();
        });
  }

  JSI_HOST_FUNCTION(dispose) {
    invalidate();
    return jsi::Value::undefined();
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(RNSkReadonlyValue, addListener),
                       JSI_EXPORT_FUNC(RNSkReadonlyValue, dispose))

  /**
   * Adds a callback that will be called whenever the value changes
   * @param cb Callback
   * @return unsubscribe function
   */
  const std::function<void()>
  addListener(const std::function<void(jsi::Runtime &)> cb) {
    std::lock_guard<std::mutex> lock(_mutex);
    auto listenerId = _listenerId++;
    _listeners.emplace(listenerId, cb);
    return [weakSelf = weak_from_this(), listenerId]() {
      auto self = weakSelf.lock();
      if (self) {
        self->removeListener(listenerId);
      }
    };
  }

  /**
    Updates the underlying value and notifies all listeners about the change.
    Listeners are only notified if the value was actually changed for numeric,
   boolean and string values. For all other values listeners are notified
   without comparison.
   @param runtime Current JS Runtime
   @param value Next value
   */
  virtual void update(jsi::Runtime &runtime, const jsi::Value &value) {
    auto equal = _valueHolder->equals(runtime, value);
    if (!equal) {
      _valueHolder->setCurrent(runtime, value);
      notifyListeners(runtime);
    }
  }

  /**
   Override to implement invalidation logic for the value. In the base class
   this function clears all subscribers.
   */
  virtual void invalidate() {
    std::lock_guard<std::mutex> lock(_mutex);
    _listeners.clear();
  }

  /**
   Returns the current value as a jsi::Value
   */
  jsi::Value getCurrent(jsi::Runtime &runtime) {
    return _valueHolder->getCurrent(runtime);
  }

  /**
   Returns the underlying current value wrapper. This can be used to query the
   holder for data type and get pointers to elements in the holder.
   */
  std::shared_ptr<RNJsi::JsiValueWrapper> getCurrent() { return _valueHolder; }

protected:
  /**
    Notifies listeners about changes
   @param runtime Current JS Runtime
   */
  void notifyListeners(jsi::Runtime &runtime) {
    std::lock_guard<std::mutex> lock(_mutex);
    for (const auto &listener : _listeners) {
      listener.second(runtime);
    }
  }

  /**
   Removes a subscription listeners
   @param listenerId identifier of listener to remove
   */
  void removeListener(long listenerId) {
    std::lock_guard<std::mutex> lock(_mutex);
    _listeners.erase(listenerId);
  }

private:
  std::shared_ptr<RNJsi::JsiValueWrapper> _valueHolder;

  long _listenerId = 0;
  std::unordered_map<long, std::function<void(jsi::Runtime &)>> _listeners;
  std::mutex _mutex;
};
} // namespace RNSkia
