#pragma once

#include <memory>
#include <utility>

#include <ABI48_0_0jsi/ABI48_0_0jsi.h>

#include "JsiSkData.h"
#include "JsiSkHostObjects.h"
#include "JsiSkTypeface.h"

namespace ABI48_0_0RNSkia {

namespace jsi = ABI48_0_0facebook::jsi;

class JsiSkTypefaceFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeFreeTypeFaceFromData) {
    auto data = JsiSkData::fromValue(runtime, arguments[0]);
    auto typeface = SkFontMgr::RefDefault()->makeFromData(std::move(data));
    if (typeface == nullptr) {
      return jsi::Value::null();
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkTypeface>(getContext(), typeface));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTypefaceFactory,
                                       MakeFreeTypeFaceFromData))

  explicit JsiSkTypefaceFactory(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace ABI48_0_0RNSkia
