#pragma once

#include <memory>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "RNSkLog.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkFont.h"
#include "SkTypeface.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkTypeface : public JsiSkWrappingSkPtrHostObject<SkTypeface> {
public:
  EXPORT_JSI_API_TYPENAME(JsiSkTypeface, Typeface)
  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTypeface, getGlyphIDs),
                       JSI_EXPORT_FUNC(JsiSkTypeface, dispose))

  JsiSkTypeface(std::shared_ptr<RNSkPlatformContext> context,
                sk_sp<SkTypeface> typeface)
      : JsiSkWrappingSkPtrHostObject(std::move(context), std::move(typeface)) {}

  JSI_HOST_FUNCTION(getGlyphIDs) {
    auto str = arguments[0].asString(runtime).utf8(runtime);
    int numGlyphIDs =
        count > 1 && !arguments[1].isNull() && !arguments[1].isUndefined()
            ? static_cast<int>(arguments[1].asNumber())
            : getObject()->textToGlyphs(str.c_str(), str.length(),
                                        SkTextEncoding::kUTF8, nullptr, 0);
    std::vector<SkGlyphID> glyphIDs;
    glyphIDs.resize(numGlyphIDs);
    getObject()->textToGlyphs(str.c_str(), str.length(), SkTextEncoding::kUTF8,
                              static_cast<SkGlyphID *>(glyphIDs.data()),
                              numGlyphIDs);
    auto jsiGlyphIDs = jsi::Array(runtime, numGlyphIDs);
    for (int i = 0; i < numGlyphIDs; i++) {
      jsiGlyphIDs.setValueAtIndex(runtime, i,
                                  jsi::Value(static_cast<int>(glyphIDs[i])));
    }
    return jsiGlyphIDs;
  }

  /**
   Returns the jsi object from a host object of this type
  */
  static jsi::Value toValue(jsi::Runtime &runtime,
                            std::shared_ptr<RNSkPlatformContext> context,
                            sk_sp<SkTypeface> tf) {
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkTypeface>(std::move(context), std::move(tf)));
  }
};

} // namespace RNSkia
