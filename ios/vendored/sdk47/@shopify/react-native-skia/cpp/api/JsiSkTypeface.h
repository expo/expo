#pragma once

#include <memory>
#include <utility>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include "JsiSkHostObjects.h"
#include <ABI47_0_0RNSkLog.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkFont.h>
#include <SkTypeface.h>

#pragma clang diagnostic pop

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class JsiSkTypeface : public JsiSkWrappingSkPtrHostObject<SkTypeface> {
public:
  // TODO: declare in JsiSkWrappingSkPtrHostObject via extra template parameter?
  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "Typeface");
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkTypeface, __typename__))

  JsiSkTypeface(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                sk_sp<SkTypeface> typeface)
      : JsiSkWrappingSkPtrHostObject(std::move(context), std::move(typeface)){}

  /**
    Returns the underlying object from a host object of this type
   */
  static sk_sp<SkTypeface> fromValue(jsi::Runtime &runtime,
                                     const jsi::Value &obj) {
    return obj.asObject(runtime)
        .asHostObject<JsiSkTypeface>(runtime)
        ->getObject();
  }

  /**
   Returns the jsi object from a host object of this type
  */
  static jsi::Value toValue(jsi::Runtime &runtime,
                              std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                              sk_sp<SkTypeface> tf) {
    return jsi::Object::createFromHostObject(
              runtime, std::make_shared<JsiSkTypeface>(std::move(context), std::move(tf)));
  }
};

} // namespace ABI47_0_0RNSkia
