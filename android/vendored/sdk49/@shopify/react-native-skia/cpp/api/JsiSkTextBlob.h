#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkTextBlob.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkTextBlob : public JsiSkWrappingSkPtrHostObject<SkTextBlob> {
public:
  JsiSkTextBlob(std::shared_ptr<RNSkPlatformContext> context,
                sk_sp<SkTextBlob> shader)
      : JsiSkWrappingSkPtrHostObject<SkTextBlob>(std::move(context),
                                                 std::move(shader)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkTextBlob, "TextBlob")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTextBlob, dispose))
};
} // namespace RNSkia
