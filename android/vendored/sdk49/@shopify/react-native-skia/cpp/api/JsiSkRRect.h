#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkRRect.h"

#include "JsiSkRect.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkRRect : public JsiSkWrappingSharedPtrHostObject<SkRRect> {
public:
  JSI_PROPERTY_GET(rx) {
    return static_cast<double>(getObject()->getSimpleRadii().x());
  }
  JSI_PROPERTY_GET(ry) {
    return static_cast<double>(getObject()->getSimpleRadii().y());
  }
  JSI_PROPERTY_GET(rect) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkRect>(getContext(), getObject()->getBounds()));
  }

  JSI_API_TYPENAME("RRect");

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkRRect, rx),
                              JSI_EXPORT_PROP_GET(JsiSkRRect, ry),
                              JSI_EXPORT_PROP_GET(JsiSkRRect, rect),
                              JSI_EXPORT_PROP_GET(JsiSkRRect, __typename__))

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkRRect, dispose))

  JsiSkRRect(std::shared_ptr<RNSkPlatformContext> context, const SkRRect &rect)
      : JsiSkWrappingSharedPtrHostObject<SkRRect>(
            std::move(context), std::make_shared<SkRRect>(rect)) {}

  /**
    Returns the underlying object from a host object of this type
   */
  static std::shared_ptr<SkRRect> fromValue(jsi::Runtime &runtime,
                                            const jsi::Value &obj) {

    const auto &object = obj.asObject(runtime);
    if (object.isHostObject(runtime)) {
      return obj.asObject(runtime)
          .asHostObject<JsiSkRRect>(runtime)
          ->getObject();
    } else {
      auto rect =
          JsiSkRect::fromValue(runtime, object.getProperty(runtime, "rect"));
      auto rx = object.getProperty(runtime, "rx").asNumber();
      auto ry = object.getProperty(runtime, "ry").asNumber();
      return std::make_shared<SkRRect>(SkRRect::MakeRectXY(*rect, rx, ry));
    }
  }

  /**
    Returns the jsi object from a host object of this type
   */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            const SkRRect &rect) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkRRect>(std::move(context), rect));
  }

  /**
   * Creates the function for construction a new instance of the SkRect
   * wrapper
   * @param context platform context
   * @return A function for creating a new host object wrapper for the SkRect
   * class
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      // Set up the rect
      auto rect = JsiSkRect::fromValue(runtime, arguments[0]).get();
      auto rx = arguments[1].asNumber();
      auto ry = arguments[2].asNumber();
      auto rrect = SkRRect::MakeRectXY(*rect, rx, ry);
      // Return the newly constructed object
      return jsi::Object::createFromHostObject(
          runtime,
          std::make_shared<JsiSkRRect>(std::move(context), std::move(rrect)));
    };
  }
};
} // namespace RNSkia
