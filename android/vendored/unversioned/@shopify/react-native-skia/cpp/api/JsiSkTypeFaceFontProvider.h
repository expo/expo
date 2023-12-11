#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkFontStyle.h"
#include "JsiSkHostObjects.h"
#include "JsiSkTypeface.h"

#include "RNSkLog.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkFont.h"
#include "skparagraph/include/TypefaceFontProvider.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;
namespace para = skia::textlayout;

class JsiSkTypefaceFontProvider
    : public JsiSkWrappingSkPtrHostObject<para::TypefaceFontProvider> {
public:
  EXPORT_JSI_API_TYPENAME(JsiSkTypefaceFontProvider, TypefaceFontProvider)

  JSI_EXPORT_FUNCTIONS(
      JSI_EXPORT_FUNC(JsiSkTypefaceFontProvider, dispose),
      JSI_EXPORT_FUNC(JsiSkTypefaceFontProvider, registerFont),
      JSI_EXPORT_FUNC(JsiSkTypefaceFontProvider, matchFamilyStyle),
      JSI_EXPORT_FUNC(JsiSkTypefaceFontProvider, countFamilies),
      JSI_EXPORT_FUNC(JsiSkTypefaceFontProvider, getFamilyName))

  JSI_HOST_FUNCTION(registerFont) {
    sk_sp<SkTypeface> typeface =
        JsiSkTypeface::fromValue(runtime, arguments[0]);
    SkString familyName(arguments[1].asString(runtime).utf8(runtime).c_str());
    auto result = getObject()->registerTypeface(typeface, familyName);
    return jsi::Value::undefined();
  }

  JSI_HOST_FUNCTION(matchFamilyStyle) {
    auto name = arguments[0].asString(runtime).utf8(runtime);
    auto fontStyle = JsiSkFontStyle::fromValue(runtime, arguments[1]);
    sk_sp<SkFontStyleSet> set(getObject()->onMatchFamily(name.c_str()));
    sk_sp<SkTypeface> typeface(set->matchStyle(*fontStyle));
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkTypeface>(getContext(), typeface));
  }

  JSI_HOST_FUNCTION(countFamilies) { return getObject()->countFamilies(); }

  JSI_HOST_FUNCTION(getFamilyName) {
    auto i = static_cast<int>(arguments[0].asNumber());
    SkString name;
    getObject()->getFamilyName(i, &name);
    return jsi::String::createFromUtf8(runtime, name.c_str());
  }

  JsiSkTypefaceFontProvider(std::shared_ptr<RNSkPlatformContext> context,
                            sk_sp<para::TypefaceFontProvider> tfProvider)
      : JsiSkWrappingSkPtrHostObject(std::move(context),
                                     std::move(tfProvider)) {}

  /**
   Returns the jsi object from a host object of this type
  */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            sk_sp<para::TypefaceFontProvider> tfProvider) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkTypefaceFontProvider>(
                     std::move(context), std::move(tfProvider)));
  }
};

} // namespace RNSkia
