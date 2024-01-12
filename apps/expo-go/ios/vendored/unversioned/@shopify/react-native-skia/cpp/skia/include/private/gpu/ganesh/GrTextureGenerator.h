/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrTextureGenerator_DEFINED
#define GrTextureGenerator_DEFINED

#include "include/core/SkImageGenerator.h"
#include "include/gpu/GrTypes.h"
#include "include/private/base/SkAPI.h"

#include <cstdint>

class GrRecordingContext;
class GrSurfaceProxyView;
enum class GrImageTexGenPolicy : int;
namespace skgpu { enum class Mipmapped : bool; }
struct SkImageInfo;

class SK_API GrTextureGenerator : public SkImageGenerator {
public:
     bool isTextureGenerator() const final { return true; }

    /**
     *  If the generator can natively/efficiently return its pixels as a GPU image (backed by a
     *  texture) this will return that image. If not, this will return NULL.
     *
     *  Regarding the GrRecordingContext parameter:
     *
     *  It must be non-NULL. The generator should only succeed if:
     *  - its internal context is the same
     *  - it can somehow convert its texture into one that is valid for the provided context.
     *
     *  If the mipmapped parameter is kYes, the generator should try to create a TextureProxy that
     *  at least has the mip levels allocated and the base layer filled in. If this is not possible,
     *  the generator is allowed to return a non mipped proxy, but this will have some additional
     *  overhead in later allocating mips and copying of the base layer.
     *
     *  GrImageTexGenPolicy determines whether or not a new texture must be created (and its budget
     *  status) or whether this may (but is not required to) return a pre-existing texture that is
     *  retained by the generator (kDraw).
     */
    GrSurfaceProxyView generateTexture(GrRecordingContext*,
                                       const SkImageInfo& info,
                                       skgpu::Mipmapped mipmapped,
                                       GrImageTexGenPolicy);

    // External clients should override GrExternalTextureGenerator instead of trying to implement
    // this (which uses private Skia types)
    virtual GrSurfaceProxyView onGenerateTexture(GrRecordingContext*, const SkImageInfo&,
                                                 skgpu::Mipmapped, GrImageTexGenPolicy) = 0;

    // Most internal SkImageGenerators produce textures and views that use kTopLeft_GrSurfaceOrigin.
    // If the generator may produce textures with different origins (e.g.
    // GrAHardwareBufferImageGenerator) it should override this function to return the correct
    // origin. Implementations should be thread-safe.
    virtual GrSurfaceOrigin origin() const { return kTopLeft_GrSurfaceOrigin; }

protected:
    GrTextureGenerator(const SkImageInfo& info, uint32_t uniqueId = kNeedNewImageUniqueID);
};

#endif  // GrTextureGenerator_DEFINED
