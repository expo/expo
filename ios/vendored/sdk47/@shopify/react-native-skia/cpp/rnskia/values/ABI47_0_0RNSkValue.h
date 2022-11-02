#pragma once

#include <functional>
#include <memory>

#include <JsiHostObject.h>
#include <ABI47_0_0RNSkPlatformContext.h>
#include <ABI47_0_0RNSkReadonlyValue.h>
#include <ABI47_0_0RNSkAnimation.h>
#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

namespace ABI47_0_0RNSkia
{
using namespace ABI47_0_0facebook;
/**
 Implements a Value that can be both read and written to. It inherits from the ReadonlyValue with
 functionailty for subscribing to changes.
 */
class ABI47_0_0RNSkValue : public ABI47_0_0RNSkReadonlyValue
{
public:
  ABI47_0_0RNSkValue(std::shared_ptr<ABI47_0_0RNSkPlatformContext> platformContext,
            jsi::Runtime& runtime, const jsi::Value *arguments, size_t count)
      : ABI47_0_0RNSkReadonlyValue(platformContext) {
        if(count == 1) {
          update(runtime, arguments[0]);
        }
      }

  ~ABI47_0_0RNSkValue() {
    unsubscribe();
  }

  JSI_PROPERTY_SET(current) {
    // When someone else is setting the value we need to stop any ongoing
    // animations
    unsubscribe();
    update(runtime, value);
  }

  JSI_PROPERTY_SET(animation) {
    // Cancel existing animation
    unsubscribe();

    // Verify input
    if(value.isObject() && value.asObject(runtime).isHostObject<ABI47_0_0RNSkAnimation>(runtime)) {
      auto animation = value.asObject(runtime).getHostObject<ABI47_0_0RNSkAnimation>(runtime);
      if(animation != nullptr) {
        // Now we have a value animation - let us connect and start
        subscribe(animation);
      }
    } else if(value.isUndefined() || value.isNull()) {
      // Do nothing - we've already unsubscribed
    } else {
      throw jsi::JSError(runtime, "Animation expected.");
    }
  }

  JSI_PROPERTY_GET(animation) {
    if(_animation != nullptr) {
      return jsi::Object::createFromHostObject(runtime, _animation);
    }
    return jsi::Value::undefined();
  }

  JSI_EXPORT_PROPERTY_SETTERS(JSI_EXPORT_PROP_SET(ABI47_0_0RNSkValue, current),
                              JSI_EXPORT_PROP_SET(ABI47_0_0RNSkValue, animation))

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(ABI47_0_0RNSkReadonlyValue, __typename__),
                              JSI_EXPORT_PROP_GET(ABI47_0_0RNSkValue, current),
                              JSI_EXPORT_PROP_GET(ABI47_0_0RNSkValue, animation))

  JSI_EXPORT_FUNCTIONS(
    JSI_EXPORT_FUNC(ABI47_0_0RNSkValue, addListener),
    JSI_EXPORT_FUNC(ABI47_0_0RNSkReadonlyValue, __invalidate)
  )

private:
  void subscribe(std::shared_ptr<ABI47_0_0RNSkAnimation> animation) {
    if(animation != nullptr) {
      _animation = animation;
      _unsubscribe = std::make_shared<std::function<void()>>(
        _animation->addListener([weakSelf = weak_from_this()](jsi::Runtime &runtime) {
        auto self = weakSelf.lock();
        if(self) {
          auto selfAsThis = std::dynamic_pointer_cast<ABI47_0_0RNSkValue>(self);
          selfAsThis->animationDidUpdate(runtime);
        }
      }));
      // Start the animation
      _animation->startClock();
    }
  }

  void animationDidUpdate(jsi::Runtime& runtime) {
    if(_animation != nullptr) {
      // Update ourselves from the current animation value
      update(runtime, _animation->get_current(runtime));
    }
  }

  void unsubscribe() {
    if(_unsubscribe != nullptr) {
      (*_unsubscribe)();
      _unsubscribe = nullptr;
    }

    if(_animation != nullptr) {
      _animation->stopClock();
      _animation = nullptr;
    }
  }

  std::shared_ptr<ABI47_0_0RNSkAnimation> _animation;
  std::shared_ptr<std::function<void()>> _unsubscribe;
};

}
