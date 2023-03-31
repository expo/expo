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

namespace ABI48_0_0RNSkia {

namespace jsi = ABI48_0_0facebook::jsi;

class JsiSkContourMeasureIter
    : public JsiSkWrappingSharedPtrHostObject<SkContourMeasureIter> {
public:
  JsiSkContourMeasureIter(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                          const SkPath &path, bool forceClosed,
                          SkScalar resScale = 1)
      : JsiSkWrappingSharedPtrHostObject<SkContourMeasureIter>(
            std::move(context), std::make_shared<SkContourMeasureIter>(
                                    path, forceClosed, resScale)) {}

  // TODO: declare in JsiSkWrappingSkPtrHostObject via extra template parameter?
  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "ContourMeasureIter");
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkContourMeasureIter,
                                                  __typename__), )

  JSI_HOST_FUNCTION(next) {
    auto next = getObject()->next();
    if (next == nullptr) {
      return jsi::Value::undefined();
    }
    auto nextObject =
        std::make_shared<JsiSkContourMeasure>(getContext(), std::move(next));

    return jsi::Object::createFromHostObject(runtime, std::move(nextObject));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkContourMeasureIter, next))

  /**
  Returns the underlying object from a host object of this type
 */
  static std::shared_ptr<SkContourMeasureIter>
  fromValue(jsi::Runtime &runtime, const jsi::Value &obj) {
    return obj.asObject(runtime)
        .asHostObject<JsiSkContourMeasureIter>(runtime)
        ->getObject();
  }

  /**
   * Creates the function for construction a new instance of the
   * SkContourMeasureIter wrapper
   * @param context platform context
   * @return A function for creating a new host object wrapper for the
   * SkContourMeasureIter class
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context) {
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
} // namespace ABI48_0_0RNSkia
