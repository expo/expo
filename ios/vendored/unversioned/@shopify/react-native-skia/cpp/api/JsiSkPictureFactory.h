#pragma once

#include <memory>

#include "JsiSkColorFilter.h"
#include "JsiSkData.h"
#include "JsiSkHostObjects.h"
#include "JsiSkPicture.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkData.h"
#include "SkPicture.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkPictureFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakePicture) {
    if (!arguments[0].isObject()) {
      throw jsi::JSError(runtime, "Expected arraybuffer as first parameter");
    }
    auto array = arguments[0].asObject(runtime);
    jsi::ArrayBuffer buffer =
        array.getProperty(runtime, jsi::PropNameID::forAscii(runtime, "buffer"))
            .asObject(runtime)
            .getArrayBuffer(runtime);

    sk_sp<SkData> data =
        SkData::MakeWithCopy(buffer.data(runtime), buffer.size(runtime));
    auto picture = SkPicture::MakeFromData(data.get());
    if (picture != nullptr) {
      return jsi::Object::createFromHostObject(
          runtime, std::make_shared<JsiSkPicture>(getContext(), picture));
    } else {
      return jsi::Value::undefined();
    }
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPictureFactory, MakePicture))

  explicit JsiSkPictureFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(context) {}
};

} // namespace RNSkia
