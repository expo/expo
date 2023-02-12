
#pragma once

#include "JsiSkColorFilter.h"
#include "JsiSkHostObjects.h"
#include "JsiSkData.h"
#include "JsiSkPicture.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkPicture.h>
#include <SkData.h>

#pragma clang diagnostic pop

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;

class JsiSkPictureFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakePicture) {
    if(!arguments[0].isObject()) {
      throw jsi::JSError(runtime, "Expected arraybuffer as first parameter");
    }
    auto array = arguments[0].asObject(runtime);
    jsi::ArrayBuffer buffer = array
            .getProperty(runtime, jsi::PropNameID::forAscii(runtime, "buffer"))
            .asObject(runtime)
            .getArrayBuffer(runtime);

    sk_sp<SkData> data = SkData::MakeWithCopy(buffer.data(runtime), buffer.size(runtime));
    auto picture = SkPicture::MakeFromData(data.get());
    if(picture != nullptr) {
      return jsi::Object::createFromHostObject(
          runtime,
          std::make_shared<JsiSkPicture>(getContext(), picture));
    } else {
      return jsi::Value::undefined();
    }
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPictureFactory, MakePicture))

  JsiSkPictureFactory(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context)
      : JsiSkHostObject(context) {}
};

} // namespace ABI47_0_0RNSkia
