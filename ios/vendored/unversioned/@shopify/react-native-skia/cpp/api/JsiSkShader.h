#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkGradientShader.h"
#include "SkShader.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkShader : public JsiSkWrappingSkPtrHostObject<SkShader> {
public:
  JsiSkShader(std::shared_ptr<RNSkPlatformContext> context,
              sk_sp<SkShader> shader)
      : JsiSkWrappingSkPtrHostObject<SkShader>(std::move(context),
                                               std::move(shader)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkShader, "Shader")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkShader, dispose))
};
} // namespace RNSkia
