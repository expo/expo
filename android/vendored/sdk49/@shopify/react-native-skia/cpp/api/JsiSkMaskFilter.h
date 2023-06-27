#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkMaskFilter.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkMaskFilter : public JsiSkWrappingSkPtrHostObject<SkMaskFilter> {
public:
  JsiSkMaskFilter(std::shared_ptr<RNSkPlatformContext> context,
                  sk_sp<SkMaskFilter> maskFilter)
      : JsiSkWrappingSkPtrHostObject<SkMaskFilter>(std::move(context),
                                                   std::move(maskFilter)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkMaskFilter, "MaskFilter")
};

} // namespace RNSkia
