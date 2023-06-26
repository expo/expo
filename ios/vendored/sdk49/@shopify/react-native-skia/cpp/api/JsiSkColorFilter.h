#pragma once

#include "JsiSkHostObjects.h"
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <memory>
#include <utility>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkColorFilter.h"

#pragma clang diagnostic pop

namespace ABI49_0_0RNSkia {

namespace jsi = ABI49_0_0facebook::jsi;

class JsiSkColorFilter : public JsiSkWrappingSkPtrHostObject<SkColorFilter> {
public:
  JsiSkColorFilter(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context,
                   sk_sp<SkColorFilter> colorFilter)
      : JsiSkWrappingSkPtrHostObject<SkColorFilter>(std::move(context),
                                                    std::move(colorFilter)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkColorFilter, "ColorFilter")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkColorFilter, dispose))
};

} // namespace ABI49_0_0RNSkia
