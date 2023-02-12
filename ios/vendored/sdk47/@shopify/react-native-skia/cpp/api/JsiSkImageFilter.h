#pragma once

#include <memory>
#include <utility>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkImageFilters.h>

#pragma clang diagnostic pop

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class JsiSkImageFilter : public JsiSkWrappingSkPtrHostObject<SkImageFilter> {
public:
  JsiSkImageFilter(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context,
                   sk_sp<SkImageFilter> imageFilter)
      : JsiSkWrappingSkPtrHostObject<SkImageFilter>(std::move(context), std::move(imageFilter)){}

  // TODO: declare in JsiSkWrappingSkPtrHostObject via extra template parameter?
  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "ImageFilter");
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkImageFilter, __typename__))

  /**
    Returns the underlying object from a host object of this type
   */
  static sk_sp<SkImageFilter> fromValue(jsi::Runtime &runtime,
                                        const jsi::Value &obj) {
    return obj.asObject(runtime)
        .asHostObject<JsiSkImageFilter>(runtime)
        ->getObject();
  }
};

} // namespace ABI47_0_0RNSkia
