#pragma once

#include <memory>

#include "JsiHostObject.h"
#include "RNSkAnimation.h"
#include "RNSkComputedValue.h"
#include "RNSkPlatformContext.h"
#include "RNSkValue.h"
#include <jsi/jsi.h>

namespace RNSkia {

namespace jsi = facebook::jsi;

class RNSkValueApi : public RNJsi::JsiHostObject {
public:
  /**
   * Constructor
   * @param platformContext Platform context
   */
  explicit RNSkValueApi(std::shared_ptr<RNSkPlatformContext> platformContext)
      : JsiHostObject(), _platformContext(platformContext) {
    _valueIdentifier = 50000;
  }

  /**
   * Destructor
   */
  ~RNSkValueApi() {}

  JSI_HOST_FUNCTION(createValue) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<RNSkValue>(_platformContext, runtime,
                                             arguments, count));
  }

  JSI_HOST_FUNCTION(createComputedValue) {
    // Creation and initialization is done in two steps to be able to use weak
    // references when setting up dependencies - since weak_from_this needs our
    // instance to be a shared_ptr before calling weak_from_this().
    auto computedValue = std::make_shared<RNSkComputedValue>(
        _platformContext, runtime, arguments, count);
    computedValue->initializeDependencies(runtime, arguments, count);
    return jsi::Object::createFromHostObject(runtime, computedValue);
  }

  JSI_HOST_FUNCTION(createAnimation) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<RNSkAnimation>(_platformContext, ++_valueIdentifier,
                                        runtime, arguments, count));
  }

  JSI_HOST_FUNCTION(createClockValue) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<RNSkClockValue>(_platformContext, ++_valueIdentifier,
                                         runtime, arguments, count));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(RNSkValueApi, createValue),
                       JSI_EXPORT_FUNC(RNSkValueApi, createComputedValue),
                       JSI_EXPORT_FUNC(RNSkValueApi, createClockValue),
                       JSI_EXPORT_FUNC(RNSkValueApi, createAnimation))

private:
  // Platform context
  std::shared_ptr<RNSkPlatformContext> _platformContext;
  std::atomic<long> _valueIdentifier;
};
} // namespace RNSkia
