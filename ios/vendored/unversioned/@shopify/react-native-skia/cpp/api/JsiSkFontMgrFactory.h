#pragma once

#include <memory>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkFontMgr.h"
#include "include/ports/SkFontMgr_data.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkFontMgrFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(System) {
    auto context = getContext();
    static SkOnce once;
    static sk_sp<SkFontMgr> fontMgr;
    once([&context, &runtime] { fontMgr = context->createFontMgr(); });
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkFontMgr>(std::move(context), fontMgr));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkFontMgrFactory, System))

  explicit JsiSkFontMgrFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
