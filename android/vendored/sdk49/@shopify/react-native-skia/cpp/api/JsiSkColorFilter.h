#pragma once

#include "JsiSkHostObjects.h"
#include <jsi/jsi.h>
#include <memory>
#include <utility>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkColorFilter.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkColorFilter : public JsiSkWrappingSkPtrHostObject<SkColorFilter> {
public:
  JsiSkColorFilter(std::shared_ptr<RNSkPlatformContext> context,
                   sk_sp<SkColorFilter> colorFilter)
      : JsiSkWrappingSkPtrHostObject<SkColorFilter>(std::move(context),
                                                    std::move(colorFilter)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkColorFilter, "ColorFilter")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkColorFilter, dispose))
};

} // namespace RNSkia
