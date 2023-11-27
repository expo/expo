/*
 * Copyright 2018 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkTextUtils_DEFINED
#define SkTextUtils_DEFINED

#include "include/core/SkFontTypes.h"
#include "include/core/SkScalar.h"
#include "include/core/SkTypes.h"

#include <cstddef>
#include <cstring>

class SkCanvas;
class SkFont;
class SkPaint;
class SkPath;

class SK_API SkTextUtils {
public:
    enum Align {
        kLeft_Align,
        kCenter_Align,
        kRight_Align,
    };

    static void Draw(SkCanvas*, const void* text, size_t size, SkTextEncoding,
                     SkScalar x, SkScalar y, const SkFont&, const SkPaint&, Align = kLeft_Align);

    static void DrawString(SkCanvas* canvas, const char text[], SkScalar x, SkScalar y,
                           const SkFont& font, const SkPaint& paint, Align align = kLeft_Align) {
        Draw(canvas, text, strlen(text), SkTextEncoding::kUTF8, x, y, font, paint, align);
    }

    static void GetPath(const void* text, size_t length, SkTextEncoding, SkScalar x, SkScalar y,
                        const SkFont&, SkPath*);
};

#endif
