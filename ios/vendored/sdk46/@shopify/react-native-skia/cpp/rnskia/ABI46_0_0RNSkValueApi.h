
#pragma once

#include <JsiHostObject.h>
#include <ABI46_0_0RNSkPlatformContext.h>
#include <ABI46_0_0RNSkValue.h>
#include <ABI46_0_0RNSkComputedValue.h>
#include <ABI46_0_0RNSkAnimation.h>
#include <ABI46_0_0jsi/ABI46_0_0jsi.h>

namespace ABI46_0_0RNSkia {
using namespace ABI46_0_0facebook;

class ABI46_0_0RNSkValueApi : public JsiHostObject {
public:
  /**
   * Constructor
   * @param platformContext Platform context
   */
  ABI46_0_0RNSkValueApi(std::shared_ptr<ABI46_0_0RNSkPlatformContext> platformContext)
      : JsiHostObject(), _platformContext(platformContext) {
        _valueIdentifier = 50000;
      }

  /**
   * Destructor
   */
  ~ABI46_0_0RNSkValueApi() {    
  }
  
  JSI_HOST_FUNCTION(createValue) {
    return jsi::Object::createFromHostObject(runtime,
      std::make_shared<ABI46_0_0RNSkValue>(_platformContext, runtime, arguments, count));
  }
  
  JSI_HOST_FUNCTION(createComputedValue) {
    // Creation and initialization is done in two steps to be able to use weak references when setting
    // up dependencies - since weak_from_this needs our instance to be a shared_ptr before calling
    // weak_from_this().
    auto computedValue = std::make_shared<ABI46_0_0RNSkComputedValue>(_platformContext, runtime, arguments, count);
    computedValue->initializeDependencies(runtime, arguments, count);
    return jsi::Object::createFromHostObject(runtime, computedValue);
  }
  
  JSI_HOST_FUNCTION(createAnimation) {
    return jsi::Object::createFromHostObject(runtime,
      std::make_shared<ABI46_0_0RNSkAnimation>(_platformContext,
                                      ++_valueIdentifier,
                                      runtime,
                                      arguments,
                                      count));
  }
  
  JSI_HOST_FUNCTION(createClockValue) {
    return jsi::Object::createFromHostObject(runtime,
      std::make_shared<ABI46_0_0RNSkClockValue>(_platformContext,
                                      ++_valueIdentifier,
                                      runtime,
                                      arguments,
                                      count));
  }
  
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(ABI46_0_0RNSkValueApi, createValue),
                       JSI_EXPORT_FUNC(ABI46_0_0RNSkValueApi, createComputedValue),
                       JSI_EXPORT_FUNC(ABI46_0_0RNSkValueApi, createClockValue),
                       JSI_EXPORT_FUNC(ABI46_0_0RNSkValueApi, createAnimation))

private:
  // Platform context
  std::shared_ptr<ABI46_0_0RNSkPlatformContext> _platformContext;
  std::atomic<long> _valueIdentifier;  
};
} // namespace ABI46_0_0RNSkia
