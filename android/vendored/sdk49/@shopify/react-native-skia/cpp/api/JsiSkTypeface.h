#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "RNSkLog.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkFont.h"
#include "SkTypeface.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkTypeface : public JsiSkWrappingSkPtrHostObject<SkTypeface> {
public:
  EXPORT_JSI_API_TYPENAME(JsiSkTypeface, "Typeface")
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTypeface, dispose))

  JsiSkTypeface(std::shared_ptr<RNSkPlatformContext> context,
                sk_sp<SkTypeface> typeface)
      : JsiSkWrappingSkPtrHostObject(std::move(context), std::move(typeface)) {}

  /**
   Returns the jsi object from a host object of this type
  */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            sk_sp<SkTypeface> tf) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkTypeface>(std::move(context), std::move(tf)));
  }
};

} // namespace RNSkia
