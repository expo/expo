#pragma once

#include "SkImage.h"
#include <jsi/jsi.h>

namespace RNSkia {

namespace jsi = facebook::jsi;

class RNSkTypedArray {
public:
  static jsi::Value getTypedArray(jsi::Runtime &runtime,
                                  const jsi::Value &value, SkImageInfo &info) {
    auto reqSize = info.computeMinByteSize();
    if (reqSize > 0) {
      if (value.isObject()) {
        auto typedArray = value.asObject(runtime);
        auto size = static_cast<size_t>(
            typedArray.getProperty(runtime, "byteLength").asNumber());
        if (size >= reqSize) {
          return typedArray;
        }
      } else {
        if (info.colorType() == kRGBA_F32_SkColorType) {
          auto arrayCtor =
              runtime.global().getPropertyAsFunction(runtime, "Float32Array");
          return arrayCtor.callAsConstructor(runtime,
                                             static_cast<double>(reqSize / 4));
        } else {
          auto arrayCtor =
              runtime.global().getPropertyAsFunction(runtime, "Uint8Array");
          return arrayCtor.callAsConstructor(runtime,
                                             static_cast<double>(reqSize));
        }
      }
    }
    return jsi::Value::null();
  }
};

} // namespace RNSkia
