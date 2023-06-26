#pragma once

#include <memory>
#include <utility>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkMaskFilter.h"

#pragma clang diagnostic pop

namespace ABI49_0_0RNSkia {

namespace jsi = ABI49_0_0facebook::jsi;

class JsiSkMaskFilter : public JsiSkWrappingSkPtrHostObject<SkMaskFilter> {
public:
  JsiSkMaskFilter(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context,
                  sk_sp<SkMaskFilter> maskFilter)
      : JsiSkWrappingSkPtrHostObject<SkMaskFilter>(std::move(context),
                                                   std::move(maskFilter)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkMaskFilter, "MaskFilter")
};

} // namespace ABI49_0_0RNSkia
