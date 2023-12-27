#pragma once

#include <memory>
#include <string>
#include <utility>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "JsiSkImage.h"
#include "SkBase64.h"
#include "SkStream.h"
#include "include/codec/SkEncodedImageFormat.h"

#include "include/android/SkAnimatedImage.h"
#include "include/codec/SkAndroidCodec.h"

#pragma clang diagnostic pop

#include <jsi/jsi.h>

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkAnimatedImage
    : public JsiSkWrappingSkPtrHostObject<SkAnimatedImage> {
public:
  // TODO-API: Properties?
  JSI_HOST_FUNCTION(getCurrentFrame) {
    auto image = getObject()->getCurrentFrame();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImage>(getContext(), std::move(image)));
  }

  JSI_HOST_FUNCTION(currentFrameDuration) {
    return static_cast<int>(getObject()->currentFrameDuration());
  }

  JSI_HOST_FUNCTION(decodeNextFrame) {
    return static_cast<int>(getObject()->decodeNextFrame());
  }

  EXPORT_JSI_API_TYPENAME(JsiSkAnimatedImage, "AnimatedImage")

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkAnimatedImage, dispose),
                       JSI_EXPORT_FUNC(JsiSkAnimatedImage, getCurrentFrame),
                       JSI_EXPORT_FUNC(JsiSkAnimatedImage,
                                       currentFrameDuration),
                       JSI_EXPORT_FUNC(JsiSkAnimatedImage, decodeNextFrame))

  JsiSkAnimatedImage(std::shared_ptr<RNSkPlatformContext> context,
                     const sk_sp<SkAnimatedImage> image)
      : JsiSkWrappingSkPtrHostObject<SkAnimatedImage>(std::move(context),
                                                      std::move(image)) {}
};

} // namespace RNSkia
