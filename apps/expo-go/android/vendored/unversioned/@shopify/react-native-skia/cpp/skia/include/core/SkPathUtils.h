/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkPathUtils_DEFINED
#define SkPathUtils_DEFINED

#include "include/core/SkScalar.h"
#include "include/core/SkTypes.h"

class SkMatrix;
class SkPaint;
class SkPath;
struct SkRect;

namespace skpathutils {

/** Returns the filled equivalent of the stroked path.

    @param src       SkPath read to create a filled version
    @param paint     SkPaint, from which attributes such as stroke cap, width, miter, and join,
                     as well as pathEffect will be used.
    @param dst       resulting SkPath; may be the same as src, but may not be nullptr
    @param cullRect  optional limit passed to SkPathEffect
    @param resScale  if > 1, increase precision, else if (0 < resScale < 1) reduce precision
                     to favor speed and size
    @return          true if the dst path was updated, false if it was not (e.g. if the path
                     represents hairline and cannot be filled).
*/
SK_API bool FillPathWithPaint(const SkPath &src, const SkPaint &paint, SkPath *dst,
                              const SkRect *cullRect, SkScalar resScale = 1);

SK_API bool FillPathWithPaint(const SkPath &src, const SkPaint &paint, SkPath *dst,
                              const SkRect *cullRect, const SkMatrix &ctm);

SK_API bool FillPathWithPaint(const SkPath &src, const SkPaint &paint, SkPath *dst);

}

#endif
