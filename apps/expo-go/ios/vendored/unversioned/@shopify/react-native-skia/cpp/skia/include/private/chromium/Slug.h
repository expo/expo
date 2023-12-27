/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef sktext_gpu_Slug_DEFINED
#define sktext_gpu_Slug_DEFINED

#include "include/core/SkRect.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSerialProcs.h"  // IWYU pragma: keep
#include "include/private/base/SkAPI.h"

#include <cstddef>
#include <cstdint>

class SkCanvas;
class SkData;
class SkPaint;
class SkReadBuffer;
class SkStrikeClient;
class SkTextBlob;
class SkWriteBuffer;
struct SkPoint;

namespace sktext::gpu {
// Slug encapsulates an SkTextBlob at a specific origin, using a specific paint. It can be
// manipulated using matrix and clip changes to the canvas. If the canvas is transformed, then
// the Slug will also transform with smaller glyphs using bi-linear interpolation to render. You
// can think of a Slug as making a rubber stamp out of a SkTextBlob.
class SK_API Slug : public SkRefCnt {
public:
    // Return nullptr if the blob would not draw. This is not because of clipping, but because of
    // some paint optimization. The Slug is captured as if drawn using drawTextBlob.
    static sk_sp<Slug> ConvertBlob(
            SkCanvas* canvas, const SkTextBlob& blob, SkPoint origin, const SkPaint& paint);

    // Serialize the slug.
    sk_sp<SkData> serialize(const SkSerialProcs& procs = {}) const;
    size_t serialize(void* buffer, size_t size, const SkSerialProcs& procs = {}) const;

    // Set the client parameter to the appropriate SkStrikeClient when typeface ID translation
    // is needed.
    static sk_sp<Slug> Deserialize(const void* data,
                                   size_t size,
                                   const SkStrikeClient* client = nullptr,
                                   const SkDeserialProcs& procs = {});
    static sk_sp<Slug> MakeFromBuffer(SkReadBuffer& buffer);

    // Allows clients to deserialize SkPictures that contain slug data
    static void AddDeserialProcs(SkDeserialProcs* procs, const SkStrikeClient* client = nullptr);

    // Draw the Slug obeying the canvas's mapping and clipping.
    void draw(SkCanvas* canvas) const;

    virtual SkRect sourceBounds() const = 0;
    virtual SkRect sourceBoundsWithOrigin () const = 0;

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


}  // namespace sktext::gpu

#endif  // sktext_gpu_Slug_DEFINED
