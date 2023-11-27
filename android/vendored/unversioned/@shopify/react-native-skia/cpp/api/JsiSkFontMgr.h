#pragma once

#include <memory>
#include <numeric>
#include <utility>
#include <vector>

#include "JsiSkFontStyle.h"
#include "JsiSkHostObjects.h"
#include "RNSkLog.h"
#include <jsi/jsi.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkFontMgr.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkFontMgr : public JsiSkWrappingSkPtrHostObject<SkFontMgr> {
public:
  EXPORT_JSI_API_TYPENAME(JsiSkFontMgr, FontMgr)

  JsiSkFontMgr(std::shared_ptr<RNSkPlatformContext> context,
               sk_sp<SkFontMgr> fontMgr)
      : JsiSkWrappingSkPtrHostObject(std::move(context), fontMgr) {}

  JSI_HOST_FUNCTION(countFamilies) { return getObject()->countFamilies(); }

  JSI_HOST_FUNCTION(getFamilyName) {
    auto i = static_cast<int>(arguments[0].asNumber());
    SkString name;
    getObject()->getFamilyName(i, &name);
    return jsi::String::createFromUtf8(runtime, name.c_str());
  }

  JSI_HOST_FUNCTION(matchFamilyStyle) {
    auto name = arguments[0].asString(runtime).utf8(runtime);
    auto fontStyle = JsiSkFontStyle::fromValue(runtime, arguments[1]);
    auto typeface = getObject()->matchFamilyStyle(name.c_str(), *fontStyle);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkTypeface>(getContext(), typeface));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkFontMgr, countFamilies),
                       JSI_EXPORT_FUNC(JsiSkFontMgr, getFamilyName),
                       JSI_EXPORT_FUNC(JsiSkFontMgr, matchFamilyStyle))
};

} // namespace RNSkia
