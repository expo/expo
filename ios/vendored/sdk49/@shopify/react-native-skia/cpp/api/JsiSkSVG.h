#pragma once

#include <memory>
#include <utility>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <modules/svg/include/SkSVGDOM.h>

#pragma clang diagnostic pop

namespace ABI49_0_0RNSkia {

namespace jsi = ABI49_0_0facebook::jsi;

class JsiSkSVG : public JsiSkWrappingSkPtrHostObject<SkSVGDOM> {
public:
  JsiSkSVG(std::shared_ptr<ABI49_0_0RNSkPlatformContext> context, sk_sp<SkSVGDOM> svgdom)
      : JsiSkWrappingSkPtrHostObject<SkSVGDOM>(std::move(context),
                                               std::move(svgdom)) {}

  EXPORT_JSI_API_TYPENAME(JsiSkSVG, "SVG")

  JSI_HOST_FUNCTION(width) {
    return static_cast<double>(getObject()->containerSize().width());
  }

  JSI_HOST_FUNCTION(height) {
    return static_cast<double>(getObject()->containerSize().height());
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkSVG, width),
                       JSI_EXPORT_FUNC(JsiSkSVG, height),
                       JSI_EXPORT_FUNC(JsiSkSVG, dispose))

  /**
    Returns the underlying object from a host object of this type
   */
  static sk_sp<SkSVGDOM> fromValue(jsi::Runtime &runtime,
                                   const jsi::Value &obj) {
    return obj.asObject(runtime).asHostObject<JsiSkSVG>(runtime)->getObject();
  }
};

} // namespace ABI49_0_0RNSkia
