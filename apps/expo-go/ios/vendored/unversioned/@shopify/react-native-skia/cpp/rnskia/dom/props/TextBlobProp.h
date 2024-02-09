#pragma once

#include "DerivedNodeProp.h"

#include "JsiSkTextBlob.h"

#include <memory>
#include <string>
#include <vector>

namespace RNSkia {

class TextBlobProp : public DerivedSkProp<SkTextBlob> {
public:
  explicit TextBlobProp(PropId name,
                        const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedSkProp<SkTextBlob>(onChange) {
    _textBlobProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_textBlobProp->value().getType() != PropType::HostObject) {
      throw std::runtime_error("Expected SkTextBlob object for the " +
                               std::string(getName()) + " property.");
    }

    auto ptr = _textBlobProp->value().getAs<JsiSkTextBlob>();
    if (ptr == nullptr) {
      throw std::runtime_error("Expected SkTextBlob object for the " +
                               std::string(getName()) + " property.");
    }

    setDerivedValue(ptr->getObject());
  }

private:
  NodeProp *_textBlobProp;
};

class TextPathBlobProp : public DerivedSkProp<SkTextBlob> {
public:
  explicit TextPathBlobProp(const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedSkProp<SkTextBlob>(onChange) {
    _fontProp = defineProperty<FontProp>("font");
    _textProp = defineProperty<NodeProp>("text");
    _pathProp = defineProperty<PathProp>("path");
    _offsetProp = defineProperty<NodeProp>("initialOffset");

    _textProp->require();
    _pathProp->require();
    _offsetProp->require();
  }

  void updateDerivedValue() override {
    auto font = _fontProp->getDerivedValue();
    auto text = _textProp->value().getAsString();
    auto path = _pathProp->getDerivedValue();
    auto offset = _offsetProp->value().getAsNumber();

    if (font != nullptr) {
      // Get glyphs
      auto numGlyphIds =
          font->countText(text.c_str(), text.length(), SkTextEncoding::kUTF8);

      std::vector<SkGlyphID> glyphIds;
      glyphIds.reserve(numGlyphIds);
      auto ids = font->textToGlyphs(
          text.c_str(), text.length(), SkTextEncoding::kUTF8,
          static_cast<SkGlyphID *>(glyphIds.data()), numGlyphIds);

      // Get glyph widths
      int glyphsSize = static_cast<int>(ids);
      std::vector<SkScalar> widthPtrs;
      widthPtrs.resize(glyphsSize);
      font->getWidthsBounds(glyphIds.data(), numGlyphIds,
                            static_cast<SkScalar *>(widthPtrs.data()), nullptr,
                            nullptr); // TODO: Should we use paint somehow here?

      std::vector<SkRSXform> rsx;
      SkContourMeasureIter meas(*path, false, 1);

      auto cont = meas.next();
      auto dist = offset;

      for (size_t i = 0; i < text.length() && cont != nullptr; ++i) {
        auto width = widthPtrs[i];
        dist += width / 2;
        if (dist > cont->length()) {
          // jump to next contour
          cont = meas.next();
          if (cont == nullptr) {
            // We have come to the end of the path - terminate the string
            // right here.
            text = text.substr(0, i);
            break;
          }
          dist = width / 2;
        }
        // Gives us the (x, y) coordinates as well as the cos/sin of the tangent
        // line at that position.
        SkPoint pos;
        SkVector tan;
        if (!cont->getPosTan(dist, &pos, &tan)) {
          throw std::runtime_error(
              "Could not calculate distance when resolving text path");
        }
        auto px = pos.x();
        auto py = pos.y();
        auto tx = tan.x();
        auto ty = tan.y();

        auto adjustedX = px - (width / 2) * tx;
        auto adjustedY = py - (width / 2) * ty;

        rsx.push_back(SkRSXform::Make(tx, ty, adjustedX, adjustedY));
        dist += width / 2;
      }

      setDerivedValue(SkTextBlob::MakeFromRSXform(text.c_str(), text.length(),
                                                  rsx.data(), *font));
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  FontProp *_fontProp;
  NodeProp *_textProp;
  PathProp *_pathProp;
  NodeProp *_offsetProp;
};

} // namespace RNSkia
