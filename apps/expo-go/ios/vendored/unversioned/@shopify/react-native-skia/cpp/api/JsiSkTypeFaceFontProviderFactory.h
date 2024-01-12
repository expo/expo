#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkData.h"
#include "JsiSkHostObjects.h"
#include "JsiSkTypeFaceFontProvider.h"

namespace RNSkia {

namespace jsi = facebook::jsi;
namespace para = skia::textlayout;

class JsiSkTypefaceFontProviderFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(Make) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkTypefaceFontProvider>(
                     getContext(), sk_make_sp<para::TypefaceFontProvider>()));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTypefaceFontProviderFactory, Make))

  explicit JsiSkTypefaceFontProviderFactory(
      std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
