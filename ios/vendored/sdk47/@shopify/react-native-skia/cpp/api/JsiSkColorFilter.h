#pragma once

#include "JsiSkHostObjects.h"
#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <memory>
#include <utility>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkColorFilter.h>

#pragma clang diagnostic pop

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class JsiSkColorFilter : public JsiSkWrappingSkPtrHostObject<SkColorFilter> {
public:
  JsiSkColorFilter(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                   sk_sp<SkColorFilter> colorFilter)
      : JsiSkWrappingSkPtrHostObject<SkColorFilter>(std::move(context), std::move(colorFilter)) {}

  // TODO: declare in JsiSkWrappingSkPtrHostObject via extra template parameter?
  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "ColorFilter");
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkColorFilter, __typename__))

  /**
    Returns the underlying object from a host object of this type
   */
  static sk_sp<SkColorFilter> fromValue(jsi::Runtime &runtime,
                                        const jsi::Value &obj) {
    return obj.asObject(runtime)
        .asHostObject<JsiSkColorFilter>(runtime)
        ->getObject();
  }
};

} // namespace ABI47_0_0RNSkia
