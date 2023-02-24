#pragma once

#include <memory>
#include <utility>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include <JsiSkHostObjects.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <modules/svg/include/SkSVGDOM.h>

#pragma clang diagnostic pop

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class JsiSkSVG : public JsiSkWrappingSkPtrHostObject<SkSVGDOM> {
public:
  JsiSkSVG(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context, sk_sp<SkSVGDOM> svgdom)
      : JsiSkWrappingSkPtrHostObject<SkSVGDOM>(std::move(context), std::move(svgdom)){}

  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "SVG");
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkSVG, __typename__))

  /**
    Returns the underlying object from a host object of this type
   */
  static sk_sp<SkSVGDOM> fromValue(jsi::Runtime &runtime,
                                   const jsi::Value &obj) {
    return obj.asObject(runtime)
        .asHostObject<JsiSkSVG>(runtime)
        ->getObject();
  }
};

} // namespace ABI47_0_0RNSkia
