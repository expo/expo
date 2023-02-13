#pragma once

#include <memory>
#include <utility>

#include <ABI48_0_0jsi/ABI48_0_0jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkMatrix.h"

#pragma clang diagnostic pop

namespace ABI48_0_0RNSkia {

namespace jsi = ABI48_0_0facebook::jsi;

class JsiSkMatrix : public JsiSkWrappingSharedPtrHostObject<SkMatrix> {
public:
  JsiSkMatrix(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context, SkMatrix m)
      : JsiSkWrappingSharedPtrHostObject<SkMatrix>(
            context, std::make_shared<SkMatrix>(std::move(m))) {}

  static SkMatrix getMatrix(jsi::Runtime &runtime, const jsi::Value &value) {
    const auto &object = value.asObject(runtime);
    const auto &array = object.asArray(runtime);
    auto scaleX = array.getValueAtIndex(runtime, 0).asNumber();
    auto skewX = array.getValueAtIndex(runtime, 1).asNumber();
    auto transX = array.getValueAtIndex(runtime, 2).asNumber();
    auto skewY = array.getValueAtIndex(runtime, 3).asNumber();
    auto scaleY = array.getValueAtIndex(runtime, 4).asNumber();
    auto transY = array.getValueAtIndex(runtime, 5).asNumber();
    auto pers0 = array.getValueAtIndex(runtime, 6).asNumber();
    auto pers1 = array.getValueAtIndex(runtime, 7).asNumber();
    auto pers2 = array.getValueAtIndex(runtime, 8).asNumber();
    return SkMatrix::MakeAll(scaleX, skewX, transX, skewY, scaleY, transY,
                             pers0, pers1, pers2);
  }

  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "Matrix");
  }

  JSI_HOST_FUNCTION(concat) {
    auto m3 = JsiSkMatrix::fromValue(runtime, arguments[0]);
    getObject()->preConcat(*m3);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(translate) {
    auto x = arguments[0].asNumber();
    auto y = arguments[1].asNumber();
    getObject()->preTranslate(x, y);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(scale) {
    auto x = arguments[0].asNumber();
    auto y = count > 1 ? arguments[1].asNumber() : 1;
    getObject()->preScale(x, y);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(skew) {
    auto x = arguments[0].asNumber();
    auto y = arguments[1].asNumber();
    getObject()->preSkew(x, y);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(rotate) {
    auto a = arguments[0].asNumber();
    getObject()->preRotate(SkRadiansToDegrees(a));
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(identity) {
    getObject()->setIdentity();
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(get) {
    auto values = jsi::Array(runtime, 9);
    for (auto i = 0; i < 9; i++) {
      values.setValueAtIndex(runtime, i, getObject()->get(i));
    }
    return values;
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkMatrix, __typename__))

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkMatrix, concat),
                       JSI_EXPORT_FUNC(JsiSkMatrix, translate),
                       JSI_EXPORT_FUNC(JsiSkMatrix, scale),
                       JSI_EXPORT_FUNC(JsiSkMatrix, skew),
                       JSI_EXPORT_FUNC(JsiSkMatrix, rotate),
                       JSI_EXPORT_FUNC(JsiSkMatrix, identity),
                       JSI_EXPORT_FUNC(JsiSkMatrix, get), )

  /**
   * Returns the underlying object from a host object of this type
   */
  static std::shared_ptr<SkMatrix> fromValue(jsi::Runtime &runtime,
                                             const jsi::Value &obj) {
    const auto &object = obj.asObject(runtime);
    if (object.isHostObject(runtime)) {
      return object.asHostObject<JsiSkMatrix>(runtime)->getObject();
    } else {
      return std::make_shared<SkMatrix>(JsiSkMatrix::getMatrix(runtime, obj));
    }
  }

  static const jsi::HostFunctionType
  createCtor(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context) {
    return JSI_HOST_FUNCTION_LAMBDA {
      SkMatrix matrix;
      if (count == 1) {
        matrix = JsiSkMatrix::getMatrix(runtime, arguments[0]);
      } else {
        matrix = SkMatrix::I();
      }
      return jsi::Object::createFromHostObject(
          runtime, std::make_shared<JsiSkMatrix>(std::move(context), matrix));
    };
  }
};
} // namespace ABI48_0_0RNSkia
