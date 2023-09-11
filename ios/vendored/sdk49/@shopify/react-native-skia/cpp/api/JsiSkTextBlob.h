#pragma once

#include <memory>
#include <utility>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkTextBlob.h"

#pragma clang diagnostic pop

namespace ABI49_0_0RNSkia {

namespace jsi = ABI49_0_0facebook::jsi;

class JsiSkTextBlob : public JsiSkWrappingSkPtrHostObject<SkTextBlob> {
public:
  JsiSkTextBlob(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context,
                sk_sp<SkTextBlob> shader)
      : JsiSkWrappingSkPtrHostObject<SkTextBlob>(std::move(context),
                                                 std::move(shader)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkTextBlob, "TextBlob")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTextBlob, dispose))
};
} // namespace ABI49_0_0RNSkia
