/*
 * Copyright 2020 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkCustomTypeface_DEFINED
#define SkCustomTypeface_DEFINED

#include "include/core/SkDrawable.h"
#include "include/core/SkFontMetrics.h"
#include "include/core/SkFontStyle.h"
#include "include/core/SkPath.h"
#include "include/core/SkRect.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkTypeface.h"
#include "include/core/SkTypes.h"

#include <memory>
#include <vector>

class SkStream;
class SkStreamAsset;
struct SkFontArguments;

class SK_API SkCustomTypefaceBuilder {
public:
    SkCustomTypefaceBuilder();

    void setGlyph(SkGlyphID, float advance, const SkPath&);
    void setGlyph(SkGlyphID, float advance, sk_sp<SkDrawable>, const SkRect& bounds);

    void setMetrics(const SkFontMetrics& fm, float scale = 1);
    void setFontStyle(SkFontStyle);

    sk_sp<SkTypeface> detach();

    static constexpr SkTypeface::FactoryId FactoryId = SkSetFourByteTag('u','s','e','r');
    static sk_sp<SkTypeface> MakeFromStream(std::unique_ptr<SkStreamAsset>, const SkFontArguments&);

private:
    struct GlyphRec {
        // logical union
        SkPath            fPath;
        sk_sp<SkDrawable> fDrawable;

        SkRect            fBounds  = {0,0,0,0}; // only used for drawable glyphs atm
        float             fAdvance = 0;

        bool isDrawable() const {
            SkASSERT(!fDrawable || fPath.isEmpty());
            return fDrawable != nullptr;
        }
    };

    std::vector<GlyphRec> fGlyphRecs;
    SkFontMetrics         fMetrics;
    SkFontStyle           fStyle;

    GlyphRec& ensureStorage(SkGlyphID);

    static sk_sp<SkTypeface> Deserialize(SkStream*);

    friend class SkTypeface;
    friend class SkUserTypeface;
};

#endif
