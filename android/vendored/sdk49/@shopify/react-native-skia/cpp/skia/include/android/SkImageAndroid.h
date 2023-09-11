/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkImageAndroid_DEFINED
#define SkImageAndroid_DEFINED

#include "include/core/SkImage.h"
#include "include/core/SkRefCnt.h"
#include "include/gpu/GrTypes.h"

class SkColorSpace;
class GrDirectContext;
class SkPixmap;
struct AHardwareBuffer;

namespace SkImages {

/** (See Skia bug 7447)
    Creates SkImage from Android hardware buffer.
    Returned SkImage takes a reference on the buffer.
    Only available on Android, when __ANDROID_API__ is defined to be 26 or greater.
    @param hardwareBuffer  AHardwareBuffer Android hardware buffer
    @param colorSpace      range of colors; may be nullptr
    @return                created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> DeferredFromAHardwareBuffer(AHardwareBuffer* hardwareBuffer,
                                                  SkAlphaType alphaType = kPremul_SkAlphaType);
SK_API sk_sp<SkImage> DeferredFromAHardwareBuffer(
        AHardwareBuffer* hardwareBuffer,
        SkAlphaType alphaType,
        sk_sp<SkColorSpace> colorSpace,
        GrSurfaceOrigin surfaceOrigin = kTopLeft_GrSurfaceOrigin);

/** Creates SkImage from Android hardware buffer and uploads the data from the SkPixmap to it.
    Returned SkImage takes a reference on the buffer.
    Only available on Android, when __ANDROID_API__ is defined to be 26 or greater.
    @param context         GPU context
    @param pixmap          SkPixmap that contains data to be uploaded to the AHardwareBuffer
    @param hardwareBuffer  AHardwareBuffer Android hardware buffer
    @param surfaceOrigin   surface origin for resulting image
    @return                created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> TextureFromAHardwareBufferWithData(
        GrDirectContext* context,
        const SkPixmap& pixmap,
        AHardwareBuffer* hardwareBuffer,
        GrSurfaceOrigin surfaceOrigin = kTopLeft_GrSurfaceOrigin);

/**
 *  Like SkImagePriv::SkMakeImageFromRasterBitmap, except this can be pinned using
 *  skgpu::ganesh::PinAsTexture and CopyPixelMode is never.
 */
SK_API sk_sp<SkImage> PinnableRasterFromBitmap(const SkBitmap&);

}  // namespace SkImages

// TODO(kjlubick) remove this after Android has been ported.
namespace sk_image_factory {
inline sk_sp<SkImage> MakePinnableFromRasterBitmap(const SkBitmap& b) {
    return SkImages::PinnableRasterFromBitmap(b);
}
}  // namespace sk_image_factory

namespace skgpu::ganesh {
/**
 *  Will attempt to upload and lock the contents of the image as a texture, so that subsequent
 *  draws to a gpu-target will come from that texture (and not by looking at the original image
 *  src). In particular this is intended to use the texture even if the image's original content
 *  changes subsequent to this call (i.e. the src is mutable!).
 *
 *  Only compatible with SkImages created from SkImages::PinnableRasterFromBitmap.
 *
 *  All successful calls must be balanced by an equal number of calls to UnpinTexture().
 *
 *  Once in this "pinned" state, the image has all of the same thread restrictions that exist
 *  for a natively created gpu image (e.g. SkImage::MakeFromTexture)
 *  - all drawing, pinning, unpinning must happen in the same thread as the GrContext.
 *
 *  @return true if the image was successfully uploaded and locked into a texture
 */
bool PinAsTexture(GrRecordingContext*, SkImage*);

/**
 *  The balancing call to a successful invocation of PinAsTexture. When a balanced
 *  number of calls have been made, then the "pinned" texture is free to be purged, etc. This
 *  also means that a subsequent "pin" call will look at the original content again, and if
 *  its uniqueID/generationID has changed, then a newer texture will be uploaded/pinned.
 *
 *  Only compatible with SkImages created from SkImages::PinnableRasterFromBitmap.
 *
 *  The context passed to unpin must match the one passed to pin.
 */
void UnpinTexture(GrRecordingContext*, SkImage*);

} // namespace skgpu::ganesh

#endif
