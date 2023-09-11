#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkRect.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkRect : public JsiSkWrappingSharedPtrHostObject<SkRect> {
public:
  JSI_PROPERTY_GET(x) { return static_cast<double>(getObject()->x()); }
  JSI_PROPERTY_GET(y) { return static_cast<double>(getObject()->y()); }
  JSI_PROPERTY_GET(width) { return static_cast<double>(getObject()->width()); }
  JSI_PROPERTY_GET(height) {
    return static_cast<double>(getObject()->height());
  }
  JSI_PROPERTY_GET(left) { return static_cast<double>(getObject()->left()); }
  JSI_PROPERTY_GET(top) { return static_cast<double>(getObject()->top()); }
  JSI_PROPERTY_GET(right) { return static_cast<double>(getObject()->right()); }
  JSI_PROPERTY_GET(bottom) {
    return static_cast<double>(getObject()->bottom());
  }

  JSI_API_TYPENAME("Rect");

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkRect, x),
                              JSI_EXPORT_PROP_GET(JsiSkRect, y),
                              JSI_EXPORT_PROP_GET(JsiSkRect, width),
                              JSI_EXPORT_PROP_GET(JsiSkRect, height),
                              JSI_EXPORT_PROP_GET(JsiSkRect, __typename__))

  JSI_HOST_FUNCTION(setXYWH) {
    getObject()->setXYWH(arguments[0].asNumber(), arguments[1].asNumber(),
                         arguments[2].asNumber(), arguments[3].asNumber());
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setLTRB) {
    getObject()->setLTRB(arguments[0].asNumber(), arguments[1].asNumber(),
                         arguments[2].asNumber(), arguments[3].asNumber());
    return jsi::Value::undefined();
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkRect, setXYWH),
                       JSI_EXPORT_FUNC(JsiSkRect, setLTRB),
                       JSI_EXPORT_FUNC(JsiSkRect, dispose))

  /**
   Constructor
   */
  JsiSkRect(std::shared_ptr<RNSkPlatformContext> context, const SkRect &rect)
      : JsiSkWrappingSharedPtrHostObject<SkRect>(
            std::move(context), std::make_shared<SkRect>(rect)) {}

  /**
    Returns the underlying object from a host object of this type
   */
  static std::shared_ptr<SkRect> fromValue(jsi::Runtime &runtime,
                                           const jsi::Value &obj) {
    const auto &object = obj.asObject(runtime);
    if (object.isHostObject(runtime)) {
      return object.asHostObject<JsiSkRect>(runtime)->getObject();
    } else {
      auto x = object.getProperty(runtime, "x").asNumber();
      auto y = object.getProperty(runtime, "y").asNumber();
      auto width = object.getProperty(runtime, "width").asNumber();
      auto height = object.getProperty(runtime, "height").asNumber();
      return std::make_shared<SkRect>(SkRect::MakeXYWH(x, y, width, height));
    }
  }

  /**
    Returns the jsi object from a host object of this type
   */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            const SkRect &rect) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkRect>(std::move(context), rect));
  }
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            SkRect &&rect) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkRect>(std::move(context), std::move(rect)));
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
      SkRect rect =
          SkRect::MakeXYWH(arguments[0].asNumber(), arguments[1].asNumber(),
                           arguments[2].asNumber(), arguments[3].asNumber());

      // Return the newly constructed object
      return jsi::Object::createFromHostObject(
          runtime,
          std::make_shared<JsiSkRect>(std::move(context), std::move(rect)));
    };
  }
};
} // namespace RNSkia
