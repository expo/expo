#pragma once

#include <memory>
#include <string>
#include <utility>

#include "JsiSkHostObjects.h"
#include "JsiSkMatrix.h"
#include "JsiSkShader.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkBase64.h"
#include "SkImage.h"
#include "SkStream.h"
#include "codec/SkEncodedImageFormat.h"
#include "include/encode/SkJpegEncoder.h"
#include "include/encode/SkPngEncoder.h"

#pragma clang diagnostic pop

#include <jsi/jsi.h>

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkImage : public JsiSkWrappingSkPtrHostObject<SkImage> {
public:
  // TODO-API: Properties?
  JSI_HOST_FUNCTION(width) { return static_cast<double>(getObject()->width()); }
  JSI_HOST_FUNCTION(height) {
    return static_cast<double>(getObject()->height());
  }

  JSI_HOST_FUNCTION(makeShaderOptions) {
    auto tmx = (SkTileMode)arguments[0].asNumber();
    auto tmy = (SkTileMode)arguments[1].asNumber();
    auto fm = (SkFilterMode)arguments[2].asNumber();
    auto mm = (SkMipmapMode)arguments[3].asNumber();
    auto m = count > 4 && !arguments[4].isUndefined()
                 ? JsiSkMatrix::fromValue(runtime, arguments[4]).get()
                 : nullptr;
    auto shader =
        getObject()->makeShader(tmx, tmy, SkSamplingOptions(fm, mm), m);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(shader)));
  }

  JSI_HOST_FUNCTION(makeShaderCubic) {
    auto tmx = (SkTileMode)arguments[0].asNumber();
    auto tmy = (SkTileMode)arguments[1].asNumber();
    auto B = SkDoubleToScalar(arguments[2].asNumber());
    auto C = SkDoubleToScalar(arguments[3].asNumber());
    auto m = count > 4 && !arguments[4].isUndefined()
                 ? JsiSkMatrix::fromValue(runtime, arguments[4]).get()
                 : nullptr;
    auto shader =
        getObject()->makeShader(tmx, tmy, SkSamplingOptions({B, C}), m);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkShader>(getContext(), std::move(shader)));
  }

  JSI_HOST_FUNCTION(encodeToBytes) {
    // Get optional parameters
    auto format =
        count >= 1 ? static_cast<SkEncodedImageFormat>(arguments[0].asNumber())
                   : SkEncodedImageFormat::kPNG;
    auto quality = count == 2 ? arguments[1].asNumber() : 100.0;

    // Get data
    sk_sp<SkData> data;
    if (format == SkEncodedImageFormat::kJPEG) {
      SkJpegEncoder::Options options;
      options.fQuality = quality;
      data = SkJpegEncoder::Encode(nullptr, getObject().get(), options);
    } else {
      SkPngEncoder::Options options;
      data = SkPngEncoder::Encode(nullptr, getObject().get(), options);
    }
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

  JSI_HOST_FUNCTION(encodeToBase64) {
    // Get optional parameters
    auto format =
        count >= 1 ? static_cast<SkEncodedImageFormat>(arguments[0].asNumber())
                   : SkEncodedImageFormat::kPNG;

    auto quality = count == 2 ? arguments[1].asNumber() : 100.0;
    auto image = getObject();
    if (image->isTextureBacked()) {
      image = image->makeNonTextureImage();
    }
    sk_sp<SkData> data;
    if (format == SkEncodedImageFormat::kJPEG) {
      SkJpegEncoder::Options options;
      options.fQuality = quality;
      data = SkJpegEncoder::Encode(nullptr, image.get(), options);
    } else {
      SkPngEncoder::Options options;
      data = SkPngEncoder::Encode(nullptr, image.get(), options);
    }
    auto len = SkBase64::Encode(data->bytes(), data->size(), nullptr);
    auto buffer = std::string(len, 0);
    SkBase64::Encode(data->bytes(), data->size(),
                     reinterpret_cast<void *>(&buffer[0]));
    return jsi::String::createFromAscii(runtime, buffer);
  }

  JSI_HOST_FUNCTION(makeNonTextureImage) {
    auto image = getObject()->makeNonTextureImage();
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkImage>(getContext(), std::move(image)));
  }

  EXPORT_JSI_API_TYPENAME(JsiSkImage, "Image")

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkImage, width),
                       JSI_EXPORT_FUNC(JsiSkImage, height),
                       JSI_EXPORT_FUNC(JsiSkImage, makeShaderOptions),
                       JSI_EXPORT_FUNC(JsiSkImage, makeShaderCubic),
                       JSI_EXPORT_FUNC(JsiSkImage, encodeToBytes),
                       JSI_EXPORT_FUNC(JsiSkImage, encodeToBase64),
                       JSI_EXPORT_FUNC(JsiSkImage, makeNonTextureImage),
                       JSI_EXPORT_FUNC(JsiSkImage, dispose))

  JsiSkImage(std::shared_ptr<RNSkPlatformContext> context,
             const sk_sp<SkImage> image)
      : JsiSkWrappingSkPtrHostObject<SkImage>(std::move(context),
                                              std::move(image)) {}
};

} // namespace RNSkia
