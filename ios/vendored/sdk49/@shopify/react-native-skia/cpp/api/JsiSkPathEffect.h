#pragma once

#include <memory>
#include <utility>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPathEffect.h"

#pragma clang diagnostic pop

namespace ABI49_0_0RNSkia {

namespace jsi = ABI49_0_0facebook::jsi;

class JsiSkPathEffect : public JsiSkWrappingSkPtrHostObject<SkPathEffect> {
public:
  JsiSkPathEffect(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context,
                  sk_sp<SkPathEffect> pathEffect)
      : JsiSkWrappingSkPtrHostObject<SkPathEffect>(std::move(context),
                                                   std::move(pathEffect)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkPathEffect, "PathEffect")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkColorFilter, dispose))
};

} // namespace ABI49_0_0RNSkia
