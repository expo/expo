/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSurfaceGanesh_DEFINED
#define SkSurfaceGanesh_DEFINED

#include "include/core/SkImageInfo.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSurface.h"
#include "include/gpu/GrTypes.h"
#include "include/private/base/SkAPI.h"

class GrBackendRenderTarget;
class GrBackendTexture;
class GrRecordingContext;
class SkColorSpace;
class GrSurfaceCharacterization;
class SkSurfaceProps;
enum SkColorType : int;
namespace skgpu {
enum class Budgeted : bool;
}

namespace SkSurfaces {

/** Caller data passed to RenderTarget/TextureReleaseProc; may be nullptr. */
using ReleaseContext = void*;

/** User function called when supplied render target may be deleted. */
using RenderTargetReleaseProc = void (*)(ReleaseContext);

/** User function called when supplied texture may be deleted. */
using TextureReleaseProc = void (*)(ReleaseContext);

/** Returns SkSurface on GPU indicated by context. Allocates memory for
    pixels, based on the width, height, and SkColorType in SkImageInfo.  budgeted
    selects whether allocation for pixels is tracked by context. imageInfo
    describes the pixel format in SkColorType, and transparency in
    SkAlphaType, and color matching in SkColorSpace.

    sampleCount requests the number of samples per pixel.
    Pass zero to disable multi-sample anti-aliasing.  The request is rounded
    up to the next supported count, or rounded down if it is larger than the
    maximum supported count.

    surfaceOrigin pins either the top-left or the bottom-left corner to the origin.

    shouldCreateWithMips hints that SkImage returned by makeImageSnapshot() is mip map.

    @param context               GPU context
    @param imageInfo             width, height, SkColorType, SkAlphaType, SkColorSpace;
                                 width, or height, or both, may be zero
    @param sampleCount           samples per pixel, or 0 to disable full scene anti-aliasing
    @param surfaceOrigin         How to align the pixel data.
    @param surfaceProps          LCD striping orientation and setting for device independent
                                 fonts; may be nullptr
    @param shouldCreateWithMips  hint that SkSurface will host mip map images
    @return                      SkSurface if all parameters are valid; otherwise, nullptr
*/
SK_API sk_sp<SkSurface> RenderTarget(GrRecordingContext* context,
                                     skgpu::Budgeted budgeted,
                                     const SkImageInfo& imageInfo,
                                     int sampleCount,
                                     GrSurfaceOrigin surfaceOrigin,
                                     const SkSurfaceProps* surfaceProps,
                                     bool shouldCreateWithMips = false,
                                     bool isProtected = false);
inline sk_sp<SkSurface> RenderTarget(GrRecordingContext* context,
                                     skgpu::Budgeted budgeted,
                                     const SkImageInfo& imageInfo,
                                     int sampleCount,
                                     const SkSurfaceProps* surfaceProps) {
    return RenderTarget(
            context, budgeted, imageInfo, sampleCount, kBottomLeft_GrSurfaceOrigin, surfaceProps);
}
inline sk_sp<SkSurface> RenderTarget(GrRecordingContext* context,
                                     skgpu::Budgeted budgeted,
                                     const SkImageInfo& imageInfo) {
    if (!imageInfo.width() || !imageInfo.height()) {
        return nullptr;
    }
    return RenderTarget(context, budgeted, imageInfo, 0, kBottomLeft_GrSurfaceOrigin, nullptr);
}

/** Returns SkSurface on GPU indicated by context that is compatible with the provided
    characterization. budgeted selects whether allocation for pixels is tracked by context.

    @param context           GPU context
    @param characterization  description of the desired SkSurface
    @return                  SkSurface if all parameters are valid; otherwise, nullptr
*/
SK_API sk_sp<SkSurface> RenderTarget(GrRecordingContext* context,
                                     const GrSurfaceCharacterization& characterization,
                                     skgpu::Budgeted budgeted);

/** Wraps a GPU-backed texture into SkSurface. Caller must ensure the texture is
    valid for the lifetime of returned SkSurface. If sampleCnt greater than zero,
    creates an intermediate MSAA SkSurface which is used for drawing backendTexture.

    SkSurface is returned if all parameters are valid. backendTexture is valid if
    its pixel configuration agrees with colorSpace and context; for instance, if
    backendTexture has an sRGB configuration, then context must support sRGB,
    and colorSpace must be present. Further, backendTexture width and height must
    not exceed context capabilities, and the context must be able to support
    back-end textures.

    Upon success textureReleaseProc is called when it is safe to delete the texture in the
    backend API (accounting only for use of the texture by this surface). If SkSurface creation
    fails textureReleaseProc is called before this function returns.

    @param context             GPU context
    @param backendTexture      texture residing on GPU
    @param sampleCnt           samples per pixel, or 0 to disable full scene anti-aliasing
    @param colorSpace          range of colors; may be nullptr
    @param surfaceProps        LCD striping orientation and setting for device independent
                               fonts; may be nullptr
    @param textureReleaseProc  function called when texture can be released
    @param releaseContext      state passed to textureReleaseProc
    @return                    SkSurface if all parameters are valid; otherwise, nullptr
*/
SK_API sk_sp<SkSurface> WrapBackendTexture(GrRecordingContext* context,
                                           const GrBackendTexture& backendTexture,
                                           GrSurfaceOrigin origin,
                                           int sampleCnt,
                                           SkColorType colorType,
                                           sk_sp<SkColorSpace> colorSpace,
                                           const SkSurfaceProps* surfaceProps,
                                           TextureReleaseProc textureReleaseProc = nullptr,
                                           ReleaseContext releaseContext = nullptr);

/** Wraps a GPU-backed buffer into SkSurface. Caller must ensure backendRenderTarget
    is valid for the lifetime of returned SkSurface.

    SkSurface is returned if all parameters are valid. backendRenderTarget is valid if
    its pixel configuration agrees with colorSpace and context; for instance, if
    backendRenderTarget has an sRGB configuration, then context must support sRGB,
    and colorSpace must be present. Further, backendRenderTarget width and height must
    not exceed context capabilities, and the context must be able to support
    back-end render targets.

    Upon success releaseProc is called when it is safe to delete the render target in the
    backend API (accounting only for use of the render target by this surface). If SkSurface
    creation fails releaseProc is called before this function returns.

    @param context                  GPU context
    @param backendRenderTarget      GPU intermediate memory buffer
    @param colorSpace               range of colors
    @param surfaceProps             LCD striping orientation and setting for device independent
                                    fonts; may be nullptr
    @param releaseProc              function called when backendRenderTarget can be released
    @param releaseContext           state passed to releaseProc
    @return                         SkSurface if all parameters are valid; otherwise, nullptr
*/
SK_API sk_sp<SkSurface> WrapBackendRenderTarget(GrRecordingContext* context,
                                                const GrBackendRenderTarget& backendRenderTarget,
                                                GrSurfaceOrigin origin,
                                                SkColorType colorType,
                                                sk_sp<SkColorSpace> colorSpace,
                                                const SkSurfaceProps* surfaceProps,
                                                RenderTargetReleaseProc releaseProc = nullptr,
                                                ReleaseContext releaseContext = nullptr);

using BackendHandleAccess = SkSurface::BackendHandleAccess;

/** Retrieves the back-end texture. If SkSurface has no back-end texture, an invalid
    object is returned. Call GrBackendTexture::isValid to determine if the result
    is valid.

    The returned GrBackendTexture should be discarded if the SkSurface is drawn to or deleted.

    @return                     GPU texture reference; invalid on failure
*/
SK_API GrBackendTexture GetBackendTexture(SkSurface*, BackendHandleAccess);

/** Retrieves the back-end render target. If SkSurface has no back-end render target, an invalid
    object is returned. Call GrBackendRenderTarget::isValid to determine if the result
    is valid.

    The returned GrBackendRenderTarget should be discarded if the SkSurface is drawn to
    or deleted.

    @return                     GPU render target reference; invalid on failure
*/
SK_API GrBackendRenderTarget GetBackendRenderTarget(SkSurface*, BackendHandleAccess);

/** If a surface is a Ganesh-backed surface, is being drawn with MSAA, and there is a resolve
    texture, this call will insert a resolve command into the stream of gpu commands. In order
    for the resolve to actually have an effect, the work still needs to be flushed and submitted
    to the GPU after recording the resolve command. If a resolve is not supported or the
    SkSurface has no dirty work to resolve, then this call is a no-op.

    This call is most useful when the SkSurface is created by wrapping a single sampled gpu
    texture, but asking Skia to render with MSAA. If the client wants to use the wrapped texture
    outside of Skia, the only way to trigger a resolve is either to call this command or use
    GrDirectContext::flush.
 */
SK_API void ResolveMSAA(SkSurface* surface);
inline void ResolveMSAA(sk_sp<SkSurface> surface) {
    return ResolveMSAA(surface.get());
}

}  // namespace SkSurfaces

namespace skgpu::ganesh {
// Clients should strive to call GrDirectContext::flush directly. However, there exist some
// places where the GrDirectContext is hard to find, these helpers allow for the flushing of the
// provided surface. This is a no-op if the surface is nullptr or not GPU backed.
SK_API GrSemaphoresSubmitted Flush(sk_sp<SkSurface>);
SK_API GrSemaphoresSubmitted Flush(SkSurface*);
SK_API void FlushAndSubmit(sk_sp<SkSurface>);
SK_API void FlushAndSubmit(SkSurface*);
}  // namespace skgpu::ganesh

#endif
