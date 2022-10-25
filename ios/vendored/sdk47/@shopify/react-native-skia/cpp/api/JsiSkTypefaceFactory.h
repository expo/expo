#pragma once

#include <memory>
#include <utility>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include "JsiSkTypeface.h"
#include "JsiSkHostObjects.h"
#include "JsiSkData.h"

namespace ABI47_0_0RNSkia {

    using namespace ABI47_0_0facebook;

    class JsiSkTypefaceFactory : public JsiSkHostObject {
    public:
        JSI_HOST_FUNCTION(MakeFreeTypeFaceFromData) {
            auto data = JsiSkData::fromValue(runtime, arguments[0]);
            auto typeface = SkFontMgr::RefDefault()->makeFromData(std::move(data));
            if(typeface == nullptr) {
              return jsi::Value::null();
            }
            return jsi::Object::createFromHostObject(
                runtime, std::make_shared<JsiSkTypeface>(getContext(), typeface));
        }

        JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTypefaceFactory, MakeFreeTypeFaceFromData))

        JsiSkTypefaceFactory(std::shared_ptr<ABI47_0_0RNSkPlatformContext> context)
                : JsiSkHostObject(std::move(context)) {}
    };

} // namespace ABI47_0_0RNSkia
