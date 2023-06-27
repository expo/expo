/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_ImageProvider_DEFINED
#define skgpu_graphite_ImageProvider_DEFINED

#include "include/core/SkImage.h"
#include "include/core/SkRefCnt.h"

namespace skgpu::graphite {

class Recorder;

/*
 * This class provides a centralized location for clients to perform any caching of images
 * they desire. Whenever Graphite encounters an SkImage which is not Graphite-backed
 * it will call ImageProvider::findOrCreate. The client's derived version of this class should
 * return a Graphite-backed version of the provided SkImage that meets the specified
 * requirements.
 *
 * Skia requires that 'findOrCreate' return a Graphite-backed image that preserves the
 * dimensions and alpha type of the original image. The bit depth of the
 * individual channels can change (e.g., 4444 -> 8888 is allowed) as well as the channels - as
 * long as the returned image has a superset of the original image's channels
 * (e.g., 565 -> 8888 opaque is allowed).
 *
 * Wrt mipmapping, the returned image can have different mipmap settings than requested. If
 * mipmapping was requested but not returned, the sampling level will be reduced to linear.
 * If the requirements are not met by the returned image (modulo the flexibility wrt mipmapping)
 * Graphite will drop the draw.
 *
 * Note: by default, Graphite will not perform any caching of images
 *
 * Threading concerns:
 *   If the same ImageProvider is given to multiple Recorders it is up to the
 *   client to handle any required thread synchronization. This is not limited to just
 *   restricting access to whatever map a derived class may have but extends to ensuring
 *   that an image created on one Recorder has had its creation work submitted before it
 *   is used by any work submitted by another Recording. Please note, this requirement
 *   (re the submission of creation work and image usage on different threads) is common to all
 *   graphite SkImages and isn't unique to SkImages returned by the ImageProvider.
 *
 * TODO(b/240996632): add documentation re shutdown order.
 * TODO(b/240997067): add unit tests
 */
class SK_API ImageProvider : public SkRefCnt {
public:
    // If the client's derived class already has a Graphite-backed image that has the same
    // contents as 'image' and meets the requirements, then it can be returned.
    // makeTextureImage can always be called to create an acceptable Graphite-backed image
    // which could then be cached.
    virtual sk_sp<SkImage> findOrCreate(Recorder* recorder,
                                        const SkImage* image,
                                        SkImage::RequiredImageProperties) = 0;
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_ImageProvider_DEFINED
