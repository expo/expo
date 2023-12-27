/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrExternalTextureGenerator_DEFINED
#define GrExternalTextureGenerator_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/gpu/GrBackendSurface.h"
#include "include/private/base/SkAPI.h"
#include "include/private/gpu/ganesh/GrTextureGenerator.h"

#include <memory>

class GrRecordingContext;
class GrSurfaceProxyView;
class SkImage;
enum class GrImageTexGenPolicy : int;
namespace skgpu { enum class Mipmapped : bool; }
struct SkImageInfo;

class GrExternalTexture {
public:
    virtual ~GrExternalTexture() = default;
    virtual GrBackendTexture getBackendTexture() = 0;
    virtual void dispose() = 0;
};

class SK_API GrExternalTextureGenerator : public GrTextureGenerator {
public:
    GrExternalTextureGenerator(const SkImageInfo& info);

    GrSurfaceProxyView onGenerateTexture(GrRecordingContext*,
                                         const SkImageInfo&,
                                         skgpu::Mipmapped,
                                         GrImageTexGenPolicy) override;
    virtual std::unique_ptr<GrExternalTexture> generateExternalTexture(GrRecordingContext *,
                                                                       skgpu::Mipmapped) = 0;
};

namespace SkImages {
/**
 *   Like SkImages::DeferredFromGenerator except allows for the use of GrTextureGenerator.
 *
 *   @param gen producer of textures
 *   @return    created SkImage, or nullptr
 */
SK_API sk_sp<SkImage> DeferredFromTextureGenerator(std::unique_ptr<GrTextureGenerator> gen);
}

#endif  // GrExternalTextureGenerator_DEFINED
