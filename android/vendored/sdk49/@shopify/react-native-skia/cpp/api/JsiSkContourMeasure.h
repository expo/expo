#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkContourMeasure.h"

#include "JsiSkPath.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkContourMeasure
    : public JsiSkWrappingSkPtrHostObject<SkContourMeasure> {
public:
  JsiSkContourMeasure(std::shared_ptr<RNSkPlatformContext> context,
                      const sk_sp<SkContourMeasure> contourMeasure)
      : JsiSkWrappingSkPtrHostObject(std::move(context),
                                     std::move(contourMeasure)) {
    if (contourMeasure == nullptr) {
      throw jsi::JSError(*context->getJsRuntime(), "Contour measure is null");
    }
  }

  JSI_HOST_FUNCTION(getPosTan) {
    auto dist = arguments[0].asNumber();
    SkPoint position;
    SkPoint tangent;
    auto result = getObject()->getPosTan(dist, &position, &tangent);
    if (!result) {
      throw jsi::JSError(runtime, "getSegment() failed");
    }
    auto posTan = jsi::Array(runtime, 2);
    auto pos = jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPoint>(getContext(), position));
    auto tan = jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPoint>(getContext(), tangent));
    posTan.setValueAtIndex(runtime, 0, pos);
    posTan.setValueAtIndex(runtime, 1, tan);
    return posTan;
  }

  JSI_HOST_FUNCTION(length) {
    return jsi::Value(SkScalarToDouble(getObject()->length()));
  }

  JSI_HOST_FUNCTION(isClosed) { return jsi::Value(getObject()->isClosed()); }

  JSI_HOST_FUNCTION(getSegment) {
    auto start = arguments[0].asNumber();
    auto end = arguments[1].asNumber();
    auto startWithMoveTo = arguments[2].getBool();
    SkPath path;
    auto result = getObject()->getSegment(start, end, &path, startWithMoveTo);
    if (!result) {
      throw jsi::JSError(runtime, "getSegment() failed");
    }
    return JsiSkPath::toValue(runtime, getContext(), std::move(path));
  }

  EXPORT_JSI_API_TYPENAME(JsiSkContourMeasure, "ContourMeasure")

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkContourMeasure, getPosTan),
                       JSI_EXPORT_FUNC(JsiSkContourMeasure, length),
                       JSI_EXPORT_FUNC(JsiSkContourMeasure, isClosed),
                       JSI_EXPORT_FUNC(JsiSkContourMeasure, getSegment),
                       JSI_EXPORT_FUNC(JsiSkContourMeasure, dispose))
};
} // namespace RNSkia
