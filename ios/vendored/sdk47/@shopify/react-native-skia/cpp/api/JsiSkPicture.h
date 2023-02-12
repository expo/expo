
#pragma once

#include "JsiSkHostObjects.h"
#include <JsiSkData.h>
#include <JsiSkShader.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkPicture.h>

#pragma clang diagnostic pop

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class JsiSkPicture : public JsiSkWrappingSkPtrHostObject<SkPicture> {
public:

  JsiSkPicture(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context, const sk_sp<SkPicture> picture)
      : JsiSkWrappingSkPtrHostObject<SkPicture>(context, picture) {};

  JSI_PROPERTY_GET(__typename__) {
    return jsi::String::createFromUtf8(runtime, "Picture");
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiSkPicture, __typename__))

  JSI_HOST_FUNCTION(makeShader) {
    auto tmx = (SkTileMode)arguments[0].asNumber();
    auto tmy = (SkTileMode)arguments[1].asNumber();
    auto fm = (SkFilterMode)arguments[2].asNumber();
    auto m = count > 3 && !arguments[3].isUndefined() ?
      JsiSkMatrix::fromValue(runtime, arguments[3]).get() : nullptr;
    
    auto tr = count > 4 && !arguments[4].isUndefined() ?
      JsiSkRect::fromValue(runtime, arguments[4]).get() : nullptr;
    
    // Create shader
    auto shader = getObject()->makeShader(tmx, tmy, fm, m, tr);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkShader>(getContext(), shader));
  }
  
  JSI_HOST_FUNCTION(serialize) {
    auto data = getObject()->serialize();
    auto arrayCtor = runtime.global().getPropertyAsFunction(runtime, "Uint8Array");
    size_t size = data->size();

    jsi::Object array = arrayCtor.callAsConstructor(runtime, static_cast<double>(size)).getObject(runtime);
    jsi::ArrayBuffer buffer = array
                                  .getProperty(runtime, jsi::PropNameID::forAscii(runtime, "buffer"))
                                  .asObject(runtime)
                                  .getArrayBuffer(runtime);

    auto bfrPtr = reinterpret_cast<uint8_t *>(buffer.data(runtime));
    memcpy(bfrPtr, data->bytes(), size);
    return array;  
  }
  
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPicture, makeShader),
                       JSI_EXPORT_FUNC(JsiSkPicture, serialize))

  /**
   Returns the underlying object from a host object of this type
  */
  static sk_sp<SkPicture> fromValue(jsi::Runtime &runtime,
                                            const jsi::Value &obj) {
    return obj.asObject(runtime)
        .asHostObject<JsiSkPicture>(runtime)
        .get()
        ->getObject();
  }    
};
} // namespace ABI47_0_0RNSkia
