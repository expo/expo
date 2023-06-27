#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkColor.h"
#include "JsiSkColorFilter.h"
#include "JsiSkHostObjects.h"
#include "JsiSkImageFilter.h"
#include "JsiSkMaskFilter.h"
#include "JsiSkPathEffect.h"
#include "JsiSkShader.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPaint.h"

#pragma clang diagnostic pop

namespace RNSkia {
namespace jsi = facebook::jsi;

class JsiSkPaint : public JsiSkWrappingSharedPtrHostObject<SkPaint> {
public:
  EXPORT_JSI_API_TYPENAME(JsiSkPaint, "Paint")

  JSI_HOST_FUNCTION(copy) {
    const auto *paint = getObject().get();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPaint>(getContext(), SkPaint(*paint)));
  }

  JSI_HOST_FUNCTION(reset) {
    getObject()->reset();
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(getColor) {
    return JsiSkColor::toValue(runtime, getObject()->getColor());
  }

  JSI_HOST_FUNCTION(getStrokeCap) {
    return static_cast<double>(getObject()->getStrokeCap());
  }

  JSI_HOST_FUNCTION(getStrokeJoin) {
    return static_cast<double>(getObject()->getStrokeJoin());
  }

  JSI_HOST_FUNCTION(getStrokeMiter) {
    return static_cast<double>(getObject()->getStrokeMiter());
  }

  JSI_HOST_FUNCTION(getStrokeWidth) {
    return static_cast<double>(getObject()->getStrokeWidth());
  }

  JSI_HOST_FUNCTION(getAlphaf) {
    float alphaf = getObject()->getAlphaf();
    return jsi::Value(SkScalarToDouble(alphaf));
  }

  JSI_HOST_FUNCTION(setColor) {
    SkColor color = JsiSkColor::fromValue(runtime, arguments[0]);
    getObject()->setColor(color);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setAlphaf) {
    SkScalar alpha = arguments[0].asNumber();
    getObject()->setAlphaf(alpha);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setAntiAlias) {
    bool antiAliased = arguments[0].getBool();
    getObject()->setAntiAlias(antiAliased);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setStrokeWidth) {
    SkScalar width = arguments[0].asNumber();
    getObject()->setStrokeWidth(width);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setStyle) {
    auto style = arguments[0].asNumber();
    getObject()->setStyle(static_cast<SkPaint::Style>(style));
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setStrokeCap) {
    auto cap = arguments[0].asNumber();
    getObject()->setStrokeCap(static_cast<SkPaint::Cap>(cap));
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setStrokeJoin) {
    int join = arguments[0].asNumber();
    getObject()->setStrokeJoin(static_cast<SkPaint::Join>(join));
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setStrokeMiter) {
    int limit = arguments[0].asNumber();
    getObject()->setStrokeMiter(limit);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setBlendMode) {
    auto blendMode = (SkBlendMode)arguments[0].asNumber();
    getObject()->setBlendMode(blendMode);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setMaskFilter) {
    auto maskFilter = arguments[0].isNull() || arguments[0].isUndefined()
                          ? nullptr
                          : JsiSkMaskFilter::fromValue(runtime, arguments[0]);
    getObject()->setMaskFilter(std::move(maskFilter));
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setImageFilter) {
    auto imageFilter = arguments[0].isNull() || arguments[0].isUndefined()
                           ? nullptr
                           : JsiSkImageFilter::fromValue(runtime, arguments[0]);
    getObject()->setImageFilter(std::move(imageFilter));
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setColorFilter) {
    auto colorFilter = arguments[0].isNull() || arguments[0].isUndefined()
                           ? nullptr
                           : JsiSkColorFilter::fromValue(runtime, arguments[0]);
    getObject()->setColorFilter(std::move(colorFilter));
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setShader) {
    auto shader = arguments[0].isNull() || arguments[0].isUndefined()
                      ? nullptr
                      : JsiSkShader::fromValue(runtime, arguments[0]);
    getObject()->setShader(std::move(shader));
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(setPathEffect) {
    auto pathEffect = arguments[0].isNull() || arguments[0].isUndefined()
                          ? nullptr
                          : JsiSkPathEffect::fromValue(runtime, arguments[0]);
    getObject()->setPathEffect(std::move(pathEffect));
    return jsi::Value::undefined();
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPaint, copy),
                       JSI_EXPORT_FUNC(JsiSkPaint, reset),
                       JSI_EXPORT_FUNC(JsiSkPaint, getAlphaf),
                       JSI_EXPORT_FUNC(JsiSkPaint, getColor),
                       JSI_EXPORT_FUNC(JsiSkPaint, getStrokeCap),
                       JSI_EXPORT_FUNC(JsiSkPaint, getStrokeJoin),
                       JSI_EXPORT_FUNC(JsiSkPaint, getStrokeMiter),
                       JSI_EXPORT_FUNC(JsiSkPaint, getStrokeWidth),
                       JSI_EXPORT_FUNC(JsiSkPaint, setPathEffect),
                       JSI_EXPORT_FUNC(JsiSkPaint, setShader),
                       JSI_EXPORT_FUNC(JsiSkPaint, setColorFilter),
                       JSI_EXPORT_FUNC(JsiSkPaint, setImageFilter),
                       JSI_EXPORT_FUNC(JsiSkPaint, setMaskFilter),
                       JSI_EXPORT_FUNC(JsiSkPaint, setBlendMode),
                       JSI_EXPORT_FUNC(JsiSkPaint, setStrokeMiter),
                       JSI_EXPORT_FUNC(JsiSkPaint, setStrokeJoin),
                       JSI_EXPORT_FUNC(JsiSkPaint, setStrokeCap),
                       JSI_EXPORT_FUNC(JsiSkPaint, setAntiAlias),
                       JSI_EXPORT_FUNC(JsiSkPaint, setStrokeWidth),
                       JSI_EXPORT_FUNC(JsiSkPaint, setStyle),
                       JSI_EXPORT_FUNC(JsiSkPaint, setColor),
                       JSI_EXPORT_FUNC(JsiSkPaint, setAlphaf),
                       JSI_EXPORT_FUNC(JsiSkPaint, dispose))

  JsiSkPaint(std::shared_ptr<RNSkPlatformContext> context, SkPaint paint)
      : JsiSkWrappingSharedPtrHostObject<SkPaint>(
            std::move(context), std::make_shared<SkPaint>(std::move(paint))) {}

  /**
   Copy from another paint
   */
  void fromPaint(const SkPaint &paint) {
    setObject(std::make_shared<SkPaint>(std::move(paint)));
  }

  /**
   * Creates the function for construction a new instance of the SkPaint
   * wrapper
   * @param context Platform context
   * @return A function for creating a new host object wrapper for the SkPaint
   * class
   */
  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      auto paint = SkPaint();
      paint.setAntiAlias(true);
      // Return the newly constructed object
      return jsi::Object::createFromHostObject(
          runtime, std::make_shared<JsiSkPaint>(std::move(context), paint));
    };
  }
};
} // namespace RNSkia
