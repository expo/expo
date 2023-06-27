// Copyright 2019 Google LLC.
#ifndef ParagraphStyle_DEFINED
#define ParagraphStyle_DEFINED

#include "include/core/SkFontStyle.h"
#include "include/core/SkScalar.h"
#include "include/core/SkString.h"
#include "modules/skparagraph/include/DartTypes.h"
#include "modules/skparagraph/include/TextStyle.h"

#include <stddef.h>
#include <algorithm>
#include <limits>
#include <string>
#include <utility>
#include <vector>

namespace skia {
namespace textlayout {

struct StrutStyle {
    StrutStyle();

    const std::vector<SkString>& getFontFamilies() const { return fFontFamilies; }
    void setFontFamilies(std::vector<SkString> families) { fFontFamilies = std::move(families); }

    SkFontStyle getFontStyle() const { return fFontStyle; }
    void setFontStyle(SkFontStyle fontStyle) { fFontStyle = fontStyle; }

    SkScalar getFontSize() const { return fFontSize; }
    void setFontSize(SkScalar size) { fFontSize = size; }

    void setHeight(SkScalar height) { fHeight = height; }
    SkScalar getHeight() const { return fHeight; }

    void setLeading(SkScalar Leading) { fLeading = Leading; }
    SkScalar getLeading() const { return fLeading; }

    bool getStrutEnabled() const { return fEnabled; }
    void setStrutEnabled(bool v) { fEnabled = v; }

    bool getForceStrutHeight() const { return fForceHeight; }
    void setForceStrutHeight(bool v) { fForceHeight = v; }

    bool getHeightOverride() const { return fHeightOverride; }
    void setHeightOverride(bool v) { fHeightOverride = v; }

    void setHalfLeading(bool halfLeading) { fHalfLeading = halfLeading; }
    bool getHalfLeading() const { return fHalfLeading; }

    bool operator==(const StrutStyle& rhs) const {
        return this->fEnabled == rhs.fEnabled &&
               this->fHeightOverride == rhs.fHeightOverride &&
               this->fForceHeight == rhs.fForceHeight &&
               this->fHalfLeading == rhs.fHalfLeading &&
               nearlyEqual(this->fLeading, rhs.fLeading) &&
               nearlyEqual(this->fHeight, rhs.fHeight) &&
               nearlyEqual(this->fFontSize, rhs.fFontSize) &&
               this->fFontStyle == rhs.fFontStyle &&
               this->fFontFamilies == rhs.fFontFamilies;
    }

private:

    std::vector<SkString> fFontFamilies;
    SkFontStyle fFontStyle;
    SkScalar fFontSize;
    SkScalar fHeight;
    SkScalar fLeading;
    bool fForceHeight;
    bool fEnabled;
    bool fHeightOverride;
    // true: half leading.
    // false: scale ascent/descent with fHeight.
    bool fHalfLeading;
};

struct ParagraphStyle {
    ParagraphStyle();

    bool operator==(const ParagraphStyle& rhs) const {
        return this->fHeight == rhs.fHeight &&
               this->fEllipsis == rhs.fEllipsis &&
               this->fEllipsisUtf16 == rhs.fEllipsisUtf16 &&
               this->fTextDirection == rhs.fTextDirection && this->fTextAlign == rhs.fTextAlign &&
               this->fDefaultTextStyle == rhs.fDefaultTextStyle &&
               this->fReplaceTabCharacters == rhs.fReplaceTabCharacters;
    }

    const StrutStyle& getStrutStyle() const { return fStrutStyle; }
    void setStrutStyle(StrutStyle strutStyle) { fStrutStyle = std::move(strutStyle); }

    const TextStyle& getTextStyle() const { return fDefaultTextStyle; }
    void setTextStyle(const TextStyle& textStyle) { fDefaultTextStyle = textStyle; }

    TextDirection getTextDirection() const { return fTextDirection; }
    void setTextDirection(TextDirection direction) { fTextDirection = direction; }

    TextAlign getTextAlign() const { return fTextAlign; }
    void setTextAlign(TextAlign align) { fTextAlign = align; }

    size_t getMaxLines() const { return fLinesLimit; }
    void setMaxLines(size_t maxLines) { fLinesLimit = maxLines; }

    SkString getEllipsis() const { return fEllipsis; }
    std::u16string getEllipsisUtf16() const { return fEllipsisUtf16; }
    void setEllipsis(const std::u16string& ellipsis) {  fEllipsisUtf16 = ellipsis; }
    void setEllipsis(const SkString& ellipsis) { fEllipsis = ellipsis; }

    SkScalar getHeight() const { return fHeight; }
    void setHeight(SkScalar height) { fHeight = height; }

    TextHeightBehavior getTextHeightBehavior() const { return fTextHeightBehavior; }
    void setTextHeightBehavior(TextHeightBehavior v) { fTextHeightBehavior = v; }

    bool unlimited_lines() const {
        return fLinesLimit == std::numeric_limits<size_t>::max();
    }
    bool ellipsized() const { return !fEllipsis.isEmpty() || !fEllipsisUtf16.empty(); }
    TextAlign effective_align() const;
    bool hintingIsOn() const { return fHintingIsOn; }
    void turnHintingOff() { fHintingIsOn = false; }

    bool getReplaceTabCharacters() const { return fReplaceTabCharacters; }
    void setReplaceTabCharacters(bool value) { fReplaceTabCharacters = value; }

private:
    StrutStyle fStrutStyle;
    TextStyle fDefaultTextStyle;
    TextAlign fTextAlign;
    TextDirection fTextDirection;
    size_t fLinesLimit;
    std::u16string fEllipsisUtf16;
    SkString fEllipsis;
    SkScalar fHeight;
    TextHeightBehavior fTextHeightBehavior;
    bool fHintingIsOn;
    bool fReplaceTabCharacters;
};
}  // namespace textlayout
}  // namespace skia

#endif  // ParagraphStyle_DEFINED
