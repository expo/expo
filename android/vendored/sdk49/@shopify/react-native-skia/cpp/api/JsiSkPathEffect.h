#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPathEffect.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkPathEffect : public JsiSkWrappingSkPtrHostObject<SkPathEffect> {
public:
  JsiSkPathEffect(std::shared_ptr<RNSkPlatformContext> context,
                  sk_sp<SkPathEffect> pathEffect)
      : JsiSkWrappingSkPtrHostObject<SkPathEffect>(std::move(context),
                                                   std::move(pathEffect)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkPathEffect, "PathEffect")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkColorFilter, dispose))
};

} // namespace RNSkia
