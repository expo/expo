#pragma once

#include <memory>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

#include "JsiSkFont.h"
#include "JsiSkHostObjects.h"
#include "JsiSkRSXform.h"
#include "JsiSkTextBlob.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkTextBlob.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkTextBlobFactory : public JsiSkHostObject {
public:
  JSI_HOST_FUNCTION(MakeFromText) {
    auto str = arguments[0].asString(runtime).utf8(runtime);
    auto font = JsiSkFont::fromValue(runtime, arguments[1]);
    auto textBlob = SkTextBlob::MakeFromString(str.c_str(), *font);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkTextBlob>(getContext(), std::move(textBlob)));
  }

  JSI_HOST_FUNCTION(MakeFromGlyphs) {
    auto jsiGlyphs = arguments[0].asObject(runtime).asArray(runtime);
    auto font = JsiSkFont::fromValue(runtime, arguments[1]);
    int bytesPerGlyph = 2;
    std::vector<SkGlyphID> glyphs;
    int glyphsSize = static_cast<int>(jsiGlyphs.size(runtime));
    glyphs.reserve(glyphsSize);
    for (int i = 0; i < glyphsSize; i++) {
      glyphs.push_back(jsiGlyphs.getValueAtIndex(runtime, i).asNumber());
    }
    auto textBlob =
        SkTextBlob::MakeFromText(glyphs.data(), glyphs.size() * bytesPerGlyph,
                                 *font, SkTextEncoding::kGlyphID);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkTextBlob>(getContext(), std::move(textBlob)));
  }

  JSI_HOST_FUNCTION(MakeFromRSXform) {
    auto str = arguments[0].asString(runtime).utf8(runtime);
    auto jsiRsxforms = arguments[1].asObject(runtime).asArray(runtime);
    auto font = JsiSkFont::fromValue(runtime, arguments[2]);
    std::vector<SkRSXform> rsxforms;
    int rsxformsSize = static_cast<int>(jsiRsxforms.size(runtime));
    rsxforms.reserve(rsxformsSize);
    for (int i = 0; i < rsxformsSize; i++) {
      auto rsxform = JsiSkRSXform::fromValue(
          runtime, jsiRsxforms.getValueAtIndex(runtime, i));
      rsxforms.push_back(*rsxform);
    }
    auto textBlob = SkTextBlob::MakeFromRSXform(str.c_str(), str.length(),
                                                rsxforms.data(), *font);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkTextBlob>(getContext(), std::move(textBlob)));
  }

  JSI_HOST_FUNCTION(MakeFromRSXformGlyphs) {
    auto jsiGlyphs = arguments[0].asObject(runtime).asArray(runtime);
    auto jsiRsxforms = arguments[1].asObject(runtime).asArray(runtime);
    auto font = JsiSkFont::fromValue(runtime, arguments[2]);
    int bytesPerGlyph = 2;
    std::vector<SkGlyphID> glyphs;
    int glyphsSize = static_cast<int>(jsiGlyphs.size(runtime));
    glyphs.reserve(glyphsSize);
    for (int i = 0; i < glyphsSize; i++) {
      glyphs.push_back(jsiGlyphs.getValueAtIndex(runtime, i).asNumber());
    }
    std::vector<SkRSXform> rsxforms;
    int rsxformsSize = static_cast<int>(jsiRsxforms.size(runtime));
    rsxforms.reserve(rsxformsSize);
    for (int i = 0; i < rsxformsSize; i++) {
      auto rsxform = JsiSkRSXform::fromValue(
          runtime, jsiRsxforms.getValueAtIndex(runtime, i));
      rsxforms.push_back(*rsxform);
    }
    auto textBlob = SkTextBlob::MakeFromRSXform(
        glyphs.data(), glyphs.size() * bytesPerGlyph, rsxforms.data(), *font,
        SkTextEncoding::kGlyphID);
    return jsi::Object::createFromHostObject(
        runtime,
        std::make_shared<JsiSkTextBlob>(getContext(), std::move(textBlob)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkTextBlobFactory, MakeFromText),
                       JSI_EXPORT_FUNC(JsiSkTextBlobFactory, MakeFromGlyphs),
                       JSI_EXPORT_FUNC(JsiSkTextBlobFactory, MakeFromRSXform),
                       JSI_EXPORT_FUNC(JsiSkTextBlobFactory,
                                       MakeFromRSXformGlyphs), )

  explicit JsiSkTextBlobFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
