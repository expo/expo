/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrSlug_DEFINED
#define GrSlug_DEFINED

#include "include/core/SkData.h"
#include "include/core/SkRect.h"
#include "include/core/SkRefCnt.h"

class SkCanvas;
class SkMatrix;
class SkPaint;
class SkTextBlob;
class SkReadBuffer;
class SkStrikeClient;
class SkWriteBuffer;

// You can use GrSlug to simulate drawTextBlob by defining the following at compile time.
//    SK_EXPERIMENTAL_SIMULATE_DRAWGLYPHRUNLIST_WITH_SLUG
// You can use GrSlug serialization to simulate drawTextBlob by defining the following:
//    SK_EXPERIMENTAL_SIMULATE_DRAWGLYPHRUNLIST_WITH_SLUG_SERIALIZE
// For Skia, add this to your args.gn file.
//    extra_cflags = ["-D", "SK_EXPERIMENTAL_SIMULATE_DRAWGLYPHRUNLIST_WITH_SLUG"]

// Internal infrastructure for using SubRuns.
class SK_API GrTextReferenceFrame : public SkRefCnt {
public:
    ~GrTextReferenceFrame() override;
    virtual const SkMatrix& initialPositionMatrix() const = 0;
};

// GrSlug encapsulates an SkTextBlob at a specific origin, using a specific paint. It can be
// manipulated using matrix and clip changes to the canvas. If the canvas is transformed, then
// the GrSlug will also transform with smaller glyphs using bi-linear interpolation to render. You
// can think of a GrSlug as making a rubber stamp out of a SkTextBlob.
class SK_API GrSlug : public GrTextReferenceFrame {
public:
    ~GrSlug() override;
    // Return nullptr if the blob would not draw. This is not because of clipping, but because of
    // some paint optimization. The GrSlug is captured as if drawn using drawTextBlob.
    static sk_sp<GrSlug> ConvertBlob(
            SkCanvas* canvas, const SkTextBlob& blob, SkPoint origin, const SkPaint& paint);

    // Serialize the slug.
    sk_sp<SkData> serialize() const;
    size_t serialize(void* buffer, size_t size) const;

    // Set the client parameter to the appropriate SkStrikeClient when typeface ID translation
    // is needed.
    static sk_sp<GrSlug> Deserialize(
            const void* data, size_t size, const SkStrikeClient* client = nullptr);
    static sk_sp<GrSlug> MakeFromBuffer(SkReadBuffer& buffer);


    // Draw the GrSlug obeying the canvas's mapping and clipping.
    void draw(SkCanvas* canvas) const;

    virtual SkRect sourceBounds() const = 0;

    // The paint passed into ConvertBlob; this paint is used instead of the paint resulting from
    // the call to aboutToDraw because when we call draw(), the initial paint is needed to call
    // aboutToDraw again to get the layer right.
    virtual const SkPaint& initialPaint() const = 0;

    virtual void doFlatten(SkWriteBuffer&) const = 0;

    uint32_t uniqueID() const { return fUniqueID; }

private:
    static uint32_t NextUniqueID();
    const uint32_t  fUniqueID{NextUniqueID()};
};
#endif  // GrSlug_DEFINED
