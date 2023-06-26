#pragma once

#include <memory>
#include <utility>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include "JsiSkHostObjects.h"
#include "ABI49_0_0RNSkLog.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkFont.h"
#include "SkTypeface.h"

#pragma clang diagnostic pop

namespace ABI49_0_0RNSkia {

namespace jsi = ABI49_0_0facebook::jsi;

class JsiSkTypeface : public JsiSkWrappingSkPtrHostObject<SkTypeface> {
public:
  EXPORT_JSI_API_TYPENAME(JsiSkTypeface, "Typeface")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTypeface, dispose))

  JsiSkTypeface(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context,
                sk_sp<SkTypeface> typeface)
      : JsiSkWrappingSkPtrHostObject(std::move(context), std::move(typeface)) {}

  /**
   Returns the jsi object from a host object of this type
  */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<ABI49_0_0RNSkPlatformContext> context,
                            sk_sp<SkTypeface> tf) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkTypeface>(std::move(context), std::move(tf)));
  }
};

} // namespace ABI49_0_0RNSkia
