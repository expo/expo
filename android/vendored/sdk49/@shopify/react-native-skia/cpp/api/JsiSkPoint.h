#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPoint.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkPoint : public JsiSkWrappingSharedPtrHostObject<SkPoint> {
public:
  JSI_PROPERTY_GET(x) { return static_cast<double>(getObject()->x()); }

  JSI_PROPERTY_GET(y) { return static_cast<double>(getObject()->y()); }

  JSI_API_TYPENAME("Point");

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkPoint, x),
                              JSI_EXPORT_PROP_GET(JsiSkPoint, y),
                              JSI_EXPORT_PROP_GET(JsiSkPoint, __typename__))

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPoint, dispose))

  JsiSkPoint(std::shared_ptr<RNSkPlatformContext> context, const SkPoint &point)
      : JsiSkWrappingSharedPtrHostObject<SkPoint>(
            std::move(context), std::make_shared<SkPoint>(point)) {}

  /**
  Returns the underlying object from a host object of this type
 */
  static std::shared_ptr<SkPoint> fromValue(jsi::Runtime &runtime,
                                            const jsi::Value &obj) {
    const auto &object = obj.asObject(runtime);
    if (object.isHostObject(runtime)) {
      return object.asHostObject<JsiSkPoint>(runtime)->getObject();
    } else {
      auto x = object.getProperty(runtime, "x").asNumber();
      auto y = object.getProperty(runtime, "y").asNumber();
      return std::make_shared<SkPoint>(SkPoint::Make(x, y));
    }
  }

  /**
  Returns the jsi object from a host object of this type
 */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            const SkPoint &point) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPoint>(std::move(context), point));
  }

  /**
   * Creates the function for construction a new instance of the SkPoint
   * wrapper
   * @param context platform context
   * @return A function for creating a new host object wrapper for the SkPoint
   * class
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      auto point =
          SkPoint::Make(arguments[0].asNumber(), arguments[1].asNumber());

      // Return the newly constructed object
      return jsi::Object::createFromHostObject(
          runtime,
          std::make_shared<JsiSkPoint>(std::move(context), std::move(point)));
    };
  }
};
} // namespace RNSkia
