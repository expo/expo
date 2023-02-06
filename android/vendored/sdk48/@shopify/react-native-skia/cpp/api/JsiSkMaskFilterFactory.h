#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkColorFilter.h"
#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkMaskFilter.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkMaskFilterFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeBlur) {
    int blurStyle = arguments[0].asNumber();
    float sigma = arguments[1].asNumber();
    bool respectCTM = arguments[2].getBool();
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkMaskFilter>(
            getContext(),
            SkMaskFilter::MakeBlur((SkBlurStyle)blurStyle, sigma, respectCTM)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkMaskFilterFactory, MakeBlur))

  explicit JsiSkMaskFilterFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
