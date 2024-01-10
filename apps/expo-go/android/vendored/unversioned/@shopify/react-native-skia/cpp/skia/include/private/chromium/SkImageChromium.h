/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkImageChromium_DEFINED
#define SkImageChromium_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

class GrBackendFormat;
class GrContextThreadSafeProxy;
class GrPromiseImageTexture;
class GrDirectContext;
class GrYUVABackendTextureInfo;
class SkColorSpace;
class SkImage;
enum SkAlphaType : int;
enum SkColorType : int;
enum GrSurfaceOrigin : int;
namespace skgpu {
enum class Mipmapped : bool;
}
struct SkISize;

/**
 * These functions expose features that are only for external use in Chromium.
 */

namespace SkImages {

using PromiseImageTextureContext = void*;
using PromiseImageTextureFulfillProc = sk_sp<GrPromiseImageTexture> (*)(PromiseImageTextureContext);
using PromiseImageTextureReleaseProc = void (*)(PromiseImageTextureContext);

/** Create a new GPU-backed SkImage that is very similar to an SkImage created by BorrowTextureFrom.
    The difference is that the caller need not have created the texture nor populated it with the
    image pixel data. Moreover, the SkImage may be created on a thread as the creation of the
    image does not require access to the backend API or GrDirectContext. Instead of passing a
    GrBackendTexture the client supplies a description of the texture consisting of
    GrBackendFormat, width, height, and skgpu::Mipmapped state. The resulting SkImage can be drawn
    to a GrDeferredDisplayListRecorder or directly to a GPU-backed SkSurface.
    When the actual texture is required to perform a backend API draw, textureFulfillProc will
    be called to receive a GrBackendTexture. The properties of the GrBackendTexture must match
    those set during the SkImage creation, and it must refer to a valid existing texture in the
    backend API context/device, and be populated with the image pixel data. The texture cannot
    be deleted until textureReleaseProc is called.
    There is at most one call to each of textureFulfillProc and textureReleaseProc.
    textureReleaseProc is always called even if image creation fails or if the
    image is never fulfilled (e.g. it is never drawn or all draws are clipped out)
    @param gpuContextProxy     the thread-safe proxy of the gpu context. required.
    @param backendFormat       format of promised gpu texture
    @param dimensions          width & height of promised gpu texture
    @param mipmapped           mip mapped state of promised gpu texture
    @param origin              surface origin of promised gpu texture
    @param colorType           color type of promised gpu texture
    @param alphaType           alpha type of promised gpu texture
    @param colorSpace          range of colors; may be nullptr
    @param textureFulfillProc  function called to get actual gpu texture
    @param textureReleaseProc  function called when texture can be deleted
    @param textureContext      state passed to textureFulfillProc and textureReleaseProc
    @return                    created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> PromiseTextureFrom(sk_sp<GrContextThreadSafeProxy> gpuContextProxy,
                                         const GrBackendFormat& backendFormat,
                                         SkISize dimensions,
                                         skgpu::Mipmapped mipmapped,
                                         GrSurfaceOrigin origin,
                                         SkColorType colorType,
                                         SkAlphaType alphaType,
                                         sk_sp<SkColorSpace> colorSpace,
                                         PromiseImageTextureFulfillProc textureFulfillProc,
                                         PromiseImageTextureReleaseProc textureReleaseProc,
                                         PromiseImageTextureContext textureContext);

/** This is similar to 'PromiseTextureFrom' but it creates a GPU-backed SkImage from YUV[A] data.
    The source data may be planar (i.e. spread across multiple textures). In
    the extreme Y, U, V, and A are all in different planes and thus the image is specified by
    four textures. 'backendTextureInfo' describes the planar arrangement, texture formats,
    conversion to RGB, and origin of the textures. Separate 'textureFulfillProc' and
    'textureReleaseProc' calls are made for each texture. Each texture has its own
    PromiseImageTextureContext. If 'backendTextureInfo' is not valid then no release proc
    calls are made. Otherwise, the calls will be made even on failure. 'textureContexts' has one
    entry for each of the up to four textures, as indicated by 'backendTextureInfo'.
    Currently the mip mapped property of 'backendTextureInfo' is ignored. However, in the
    near future it will be required that if it is kYes then textureFulfillProc must return
    a mip mapped texture for each plane in order to successfully draw the image.
    @param gpuContextProxy     the thread-safe proxy of the gpu context. required.
    @param backendTextureInfo  info about the promised yuva gpu texture
    @param imageColorSpace     range of colors; may be nullptr
    @param textureFulfillProc  function called to get actual gpu texture
    @param textureReleaseProc  function called when texture can be deleted
    @param textureContexts     state passed to textureFulfillProc and textureReleaseProc
    @return                    created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> PromiseTextureFromYUVA(sk_sp<GrContextThreadSafeProxy> gpuContextProxy,
                                             const GrYUVABackendTextureInfo& backendTextureInfo,
                                             sk_sp<SkColorSpace> imageColorSpace,
                                             PromiseImageTextureFulfillProc textureFulfillProc,
                                             PromiseImageTextureReleaseProc textureReleaseProc,
                                             PromiseImageTextureContext textureContexts[]);

/** Returns the GPU context associated with this image or nullptr if the image is not Ganesh-backed.
    We expose this only to help transition certain API calls and do not intend for this to stick
    around forever.
*/
SK_API GrDirectContext* GetContext(const SkImage* src);
inline GrDirectContext* GetContext(sk_sp<const SkImage> src) {
    return GetContext(src.get());
}

}  // namespace SkImages

#endif
