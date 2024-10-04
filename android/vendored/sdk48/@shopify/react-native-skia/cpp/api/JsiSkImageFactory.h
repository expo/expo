#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkData.h"
#include "JsiSkHostObjects.h"
#include "JsiSkImage.h"
#include "JsiSkImageInfo.h"

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkImageFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeImageFromEncoded) {
    auto data = JsiSkData::fromValue(runtime, arguments[0]);
    auto image = SkImage::MakeFromEncoded(data);
    if (image == nullptr) {
      return jsi::Value::null();
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImage>(getContext(), std::move(image)));
  }

  JSI_HOST_FUNCTION(MakeImage) {
    auto imageInfo = JsiSkImageInfo::fromValue(runtime, arguments[0]);
    auto pixelData = JsiSkData::fromValue(runtime, arguments[1]);
    auto bytesPerRow = arguments[2].asNumber();
    auto image = SkImage::MakeRasterData(*imageInfo, pixelData, bytesPerRow);
    if (image == nullptr) {
      return jsi::Value::null();
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImage>(getContext(), std::move(image)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkImageFactory, MakeImageFromEncoded),
                       JSI_EXPORT_FUNC(JsiSkImageFactory, MakeImage), )

  explicit JsiSkImageFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
