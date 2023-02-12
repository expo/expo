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

  // TODO: declare in JsiSkWrappingSkPtrHostObject via extra template parameter?

  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "TextBlob");
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkTextBlob,
                                                  __typename__), )

  /**
  Returns the underlying object from a host object of this type
 */
  static sk_sp<SkTextBlob> fromValue(jsi::Runtime &runtime,
                                     const jsi::Value &obj) {
    return obj.asObject(runtime)
        .asHostObject<JsiSkTextBlob>(runtime)
        ->getObject();
  }
};
} // namespace RNSkia
