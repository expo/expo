#pragma once

#include <memory>
#include <utility>

#include "JsiSkContourMeasure.h"
#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkContourMeasure.h"

#include "JsiSkPath.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkContourMeasureIter
    : public JsiSkWrappingSharedPtrHostObject<SkContourMeasureIter> {
public:
  JsiSkContourMeasureIter(std::shared_ptr<RNSkPlatformContext> context,
                          const SkPath &path, bool forceClosed,
                          SkScalar resScale = 1)
      : JsiSkWrappingSharedPtrHostObject<SkContourMeasureIter>(
            std::move(context), std::make_shared<SkContourMeasureIter>(
                                    path, forceClosed, resScale)) {}

  JSI_HOST_FUNCTION(next) {
    auto next = getObject()->next();
    if (next == nullptr) {
      return jsi::Value::undefined();
    }
    auto nextObject =
        std::make_shared<JsiSkContourMeasure>(getContext(), std::move(next));

    return jsi::Object::createFromHostObject(runtime, std::move(nextObject));
  }

  EXPORT_JSI_API_TYPENAME(JsiSkContourMeasureIter, "ContourMeasureIter")

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkContourMeasureIter, next),
                       JSI_EXPORT_FUNC(JsiSkContourMeasureIter, dispose))

  /**
   * Creates the function for construction a new instance of the
   * SkContourMeasureIter wrapper
   * @param context platform context
   * @return A function for creating a new host object wrapper for the
   * SkContourMeasureIter class
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      auto path = JsiSkPath::fromValue(runtime, arguments[0]);
      auto forceClosed = arguments[1].getBool();
      auto resScale = arguments[2].asNumber();
      // Return the newly constructed object
      return jsi::Object::createFromHostObject(
          runtime, std::make_shared<JsiSkContourMeasureIter>(
                       std::move(context), *path, forceClosed, resScale));
    };
  }
};
} // namespace RNSkia
