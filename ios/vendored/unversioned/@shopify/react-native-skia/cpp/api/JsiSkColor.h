#pragma once

#include <algorithm>
#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "third_party/CSSColorParser.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkColor.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkColor : public RNJsi::JsiHostObject {
public:
  JsiSkColor() : JsiHostObject() {}

  ~JsiSkColor() {}

  static jsi::Object toValue(jsi::Runtime &runtime, SkColor color) {
    auto result = runtime.global()
                      .getPropertyAsFunction(runtime, "Float32Array")
                      .callAsConstructor(runtime, 4)
                      .getObject(runtime);
    jsi::ArrayBuffer buffer =
        result
            .getProperty(runtime, jsi::PropNameID::forAscii(runtime, "buffer"))
            .asObject(runtime)
            .getArrayBuffer(runtime);
    auto bfrPtr = reinterpret_cast<float *>(buffer.data(runtime));
    auto color4f = SkColor4f::FromColor(color).array();
    std::copy(color4f.begin(), color4f.end(), bfrPtr);
    return result;
  }

  static SkColor fromValue(jsi::Runtime &runtime, const jsi::Value &obj) {
    const auto &object = obj.asObject(runtime);
    jsi::ArrayBuffer buffer =
        object
            .getProperty(runtime, jsi::PropNameID::forAscii(runtime, "buffer"))
            .asObject(runtime)
            .getArrayBuffer(runtime);
    auto bfrPtr = reinterpret_cast<float *>(buffer.data(runtime));
    if (bfrPtr[0] > 1 || bfrPtr[1] > 1 || bfrPtr[2] > 1 || bfrPtr[3] > 1) {
      return SK_ColorBLACK;
    }
    return SkColorSetARGB(bfrPtr[3] * 255, bfrPtr[0] * 255, bfrPtr[1] * 255,
                          bfrPtr[2] * 255);
  }

  /**
   * Creates the function for construction a new instance of the SkColor
   * wrapper
   * @return A function for creating a new host object wrapper for the SkColor
   * class
   */
  static const jsi::HostFunctionType createCtor() {
    return JSI_HOST_FUNCTION_LAMBDA {
      if (arguments[0].isNumber()) {
        return JsiSkColor::toValue(runtime, arguments[0].getNumber());
      } else if (arguments[0].isString()) {
        auto text = arguments[0].asString(runtime).utf8(runtime);
        auto color = CSSColorParser::parse(text);
        if (color.a == -1.0f) {
          return JsiSkColor::toValue(runtime, SK_ColorBLACK);
        }
        return JsiSkColor::toValue(
            runtime, SkColorSetARGB(color.a * 255, color.r, color.g, color.b));
      } else if (arguments[0].isObject()) {
        return arguments[0].getObject(runtime);
      }
      return jsi::Value::undefined();
    };
  }
};
} // namespace RNSkia
