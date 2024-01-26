/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrDeferredDisplayListRecorder_DEFINED
#define GrDeferredDisplayListRecorder_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkTypes.h"
#include "include/private/chromium/GrDeferredDisplayList.h"
#include "include/private/chromium/GrSurfaceCharacterization.h"

class GrBackendFormat;
class GrRecordingContext;
class GrRenderTargetProxy;
class GrYUVABackendTextureInfo;
class SkCanvas;
class SkColorSpace;
class SkImage;
class GrPromiseImageTexture;
class SkSurface;
enum SkAlphaType : int;
enum SkColorType : int;
enum GrSurfaceOrigin : int;
namespace skgpu {
enum class Mipmapped : bool;
}

/*
 * This class is intended to be used as:
 *   Get a GrSurfaceCharacterization representing the intended gpu-backed destination SkSurface
 *   Create one of these (a GrDeferredDisplayListRecorder) on the stack
 *   Get the canvas and render into it
 *   Snap off and hold on to a GrDeferredDisplayList
 *   Once your app actually needs the pixels, call skgpu::ganesh::DrawDDL(GrDeferredDisplayList*)
 *
 * This class never accesses the GPU but performs all the cpu work it can. It
 * is thread-safe (i.e., one can break a scene into tiles and perform their cpu-side
 * work in parallel ahead of time).
 */
class SK_API GrDeferredDisplayListRecorder {
public:
    GrDeferredDisplayListRecorder(const GrSurfaceCharacterization&);
    ~GrDeferredDisplayListRecorder();

    const GrSurfaceCharacterization& characterization() const {
        return fCharacterization;
    }

    // The backing canvas will become invalid (and this entry point will return
    // null) once 'detach' is called.
    // Note: ownership of the SkCanvas is not transferred via this call.
    SkCanvas* getCanvas();

    sk_sp<GrDeferredDisplayList> detach();

    using PromiseImageTextureContext = void*;
    using PromiseImageTextureFulfillProc =
            sk_sp<GrPromiseImageTexture> (*)(PromiseImageTextureContext);
    using PromiseImageTextureReleaseProc = void (*)(PromiseImageTextureContext);

#ifndef SK_MAKE_PROMISE_TEXTURE_DISABLE_LEGACY_API
    /** Deprecated: Use SkImages::PromiseTextureFrom instead. */
    sk_sp<SkImage> makePromiseTexture(const GrBackendFormat& backendFormat,
                                      int width,
                                      int height,
                                      skgpu::Mipmapped mipmapped,
                                      GrSurfaceOrigin origin,
                                      SkColorType colorType,
                                      SkAlphaType alphaType,
                                      sk_sp<SkColorSpace> colorSpace,
                                      PromiseImageTextureFulfillProc textureFulfillProc,
                                      PromiseImageTextureReleaseProc textureReleaseProc,
                                      PromiseImageTextureContext textureContext);

    /** Deprecated: Use SkImages::PromiseTextureFromYUVA instead. */
    sk_sp<SkImage> makeYUVAPromiseTexture(const GrYUVABackendTextureInfo& yuvaBackendTextureInfo,
                                          sk_sp<SkColorSpace> imageColorSpace,
                                          PromiseImageTextureFulfillProc textureFulfillProc,
                                          PromiseImageTextureReleaseProc textureReleaseProc,
                                          PromiseImageTextureContext textureContexts[]);
#endif // SK_MAKE_PROMISE_TEXTURE_DISABLE_LEGACY_API


private:
    GrDeferredDisplayListRecorder(const GrDeferredDisplayListRecorder&) = delete;
    GrDeferredDisplayListRecorder& operator=(const GrDeferredDisplayListRecorder&) = delete;

    bool init();

    const GrSurfaceCharacterization             fCharacterization;
    sk_sp<GrRecordingContext>                   fContext;
    sk_sp<GrRenderTargetProxy>                  fTargetProxy;
    sk_sp<GrDeferredDisplayList::LazyProxyData> fLazyProxyData;
    sk_sp<SkSurface>                            fSurface;
};

#endif
