#pragma once

#include <memory>

#include "JsiSkData.h"
#include "JsiSkHostObjects.h"
#include "JsiSkShader.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPicture.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkPicture : public JsiSkWrappingSkPtrHostObject<SkPicture> {
public:
  JsiSkPicture(std::shared_ptr<RNSkPlatformContext> context,
               const sk_sp<SkPicture> picture)
      : JsiSkWrappingSkPtrHostObject<SkPicture>(context, picture) {}

  JSI_HOST_FUNCTION(makeShader) {
    auto tmx = (SkTileMode)arguments[0].asNumber();
    auto tmy = (SkTileMode)arguments[1].asNumber();
    auto fm = (SkFilterMode)arguments[2].asNumber();
    auto m = count > 3 && !arguments[3].isUndefined()
                 ? JsiSkMatrix::fromValue(runtime, arguments[3]).get()
                 : nullptr;

    auto tr = count > 4 && !arguments[4].isUndefined()
                  ? JsiSkRect::fromValue(runtime, arguments[4]).get()
                  : nullptr;

    // Create shader
    auto shader = getObject()->makeShader(tmx, tmy, fm, m, tr);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkShader>(getContext(), shader));
  }

  JSI_HOST_FUNCTION(serialize) {
    auto data = getObject()->serialize();
    auto arrayCtor =
        runtime.global().getPropertyAsFunction(runtime, "Uint8Array");
    size_t size = data->size();

    jsi::Object array =
        arrayCtor.callAsConstructor(runtime, static_cast<double>(size))
            .getObject(runtime);
    jsi::ArrayBuffer buffer =
        array.getProperty(runtime, jsi::PropNameID::forAscii(runtime, "buffer"))
            .asObject(runtime)
            .getArrayBuffer(runtime);

    auto bfrPtr = reinterpret_cast<uint8_t *>(buffer.data(runtime));
    memcpy(bfrPtr, data->bytes(), size);
    return array;
  }

  EXPORT_JSI_API_TYPENAME(JsiSkPicture, "Picture")

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPicture, makeShader),
                       JSI_EXPORT_FUNC(JsiSkPicture, serialize),
                       JSI_EXPORT_FUNC(JsiSkPicture, dispose))
};
} // namespace RNSkia
