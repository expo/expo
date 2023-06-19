#pragma once

#include <memory>
#include <utility>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include "JsiSkImage.h"
#include "JsiSkImageInfo.h"
#include "JsiSkHostObjects.h"
#include "JsiSkData.h"

namespace ABI47_0_0RNSkia {

    using namespace ABI47_0_0facebook;

    class JsiSkImageFactory : public JsiSkHostObject {
    public:
        JSI_HOST_FUNCTION(MakeImageFromEncoded) {
            auto data = JsiSkData::fromValue(runtime, arguments[0]);
            auto image = SkImages::DeferredFromEncodedData(data);
            if(image == nullptr) {
                return jsi::Value::null();
            }
            return jsi::Object::createFromHostObject(
                    runtime, std::make_shared<JsiSkImage>(getContext(), std::move(image)));
        }

        JSI_HOST_FUNCTION(MakeImage) {
            auto imageInfo = JsiSkImageInfo::fromValue(runtime, arguments[0]);
            auto pixelData = JsiSkData::fromValue(runtime, arguments[1]);
            auto bytesPerRow = arguments[2].asNumber();
            auto image = SkImages::RasterFromData(*imageInfo, pixelData, bytesPerRow);
            if(image == nullptr) {
                return jsi::Value::null();
            }
            return jsi::Object::createFromHostObject(
                    runtime, std::make_shared<JsiSkImage>(getContext(), std::move(image)));
        }

        JSI_EXPORT_FUNCTIONS(
            JSI_EXPORT_FUNC(JsiSkImageFactory, MakeImageFromEncoded),
            JSI_EXPORT_FUNC(JsiSkImageFactory, MakeImage),
        )

        JsiSkImageFactory(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context)
                : JsiSkHostObject(std::move(context)) {}
    };

} // namespace ABI47_0_0RNSkia
