/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkImageGanesh_DEFINED
#define SkImageGanesh_DEFINED

#include "include/core/SkImage.h"
#include "include/core/SkRefCnt.h"
#include "include/gpu/GpuTypes.h"
#include "include/gpu/GrTypes.h"
#include "include/private/base/SkAPI.h"

#include <functional>
#include <utility>

class GrBackendFormat;
class GrBackendTexture;
class GrContextThreadSafeProxy;
class GrDirectContext;
class GrRecordingContext;
class GrYUVABackendTextureInfo;
class GrYUVABackendTextures;
class SkColorSpace;
class SkData;
class SkPixmap;
class SkPromiseImageTexture;
class SkYUVAPixmaps;
enum SkAlphaType : int;
enum SkColorType : int;
enum class SkTextureCompressionType;
struct SkISize;

/**
 * All factories in this file refer to the Ganesh GPU backend when they say GPU.
 */

namespace SkImages {
/** Defines a callback function, taking one parameter of type GrBackendTexture with
    no return value. Function is called when backend texture is to be released.
*/
using BackendTextureReleaseProc = std::function<void(GrBackendTexture)>;
/** User function called when supplied texture may be deleted. */
using TextureReleaseProc = void (*)(ReleaseContext);

/** Creates GPU-backed SkImage from backendTexture associated with context.
    Skia will assume ownership of the resource and will release it when no longer needed.
    A non-null SkImage is returned if format of backendTexture is recognized and supported.
    Recognized formats vary by GPU backend.
    @param context         GPU context
    @param backendTexture  texture residing on GPU
    @param textureOrigin   origin of backendTexture
    @param colorType       color type of the resulting image
    @param alphaType       alpha type of the resulting image
    @param colorSpace      range of colors; may be nullptr
    @return                created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> AdoptTextureFrom(GrRecordingContext* context,
                                       const GrBackendTexture& backendTexture,
                                       GrSurfaceOrigin textureOrigin,
                                       SkColorType colorType);
SK_API sk_sp<SkImage> AdoptTextureFrom(GrRecordingContext* context,
                                       const GrBackendTexture& backendTexture,
                                       GrSurfaceOrigin textureOrigin,
                                       SkColorType colorType,
                                       SkAlphaType alphaType);
SK_API sk_sp<SkImage> AdoptTextureFrom(GrRecordingContext* context,
                                       const GrBackendTexture& backendTexture,
                                       GrSurfaceOrigin textureOrigin,
                                       SkColorType colorType,
                                       SkAlphaType alphaType,
                                       sk_sp<SkColorSpace> colorSpace);

/** Creates GPU-backed SkImage from the provided GPU texture associated with context.
    GPU texture must stay valid and unchanged until textureReleaseProc is called by Skia.
    Skia will call textureReleaseProc with the passed-in releaseContext when SkImage
    is deleted or no longer refers to the texture.
    A non-null SkImage is returned if format of backendTexture is recognized and supported.
    Recognized formats vary by GPU backend.
    @note When using a DDL recording context, textureReleaseProc will be called on the
    GPU thread after the DDL is played back on the direct context.
    @param context             GPU context
    @param backendTexture      texture residing on GPU
    @param colorSpace          This describes the color space of this image's contents, as
                               seen after sampling. In general, if the format of the backend
                               texture is SRGB, some linear colorSpace should be supplied
                               (e.g., SkColorSpace::MakeSRGBLinear()). If the format of the
                               backend texture is linear, then the colorSpace should include
                               a description of the transfer function as
                               well (e.g., SkColorSpace::MakeSRGB()).
    @param textureReleaseProc  function called when texture can be released
    @param releaseContext      state passed to textureReleaseProc
    @return                    created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> BorrowTextureFrom(GrRecordingContext* context,
                                        const GrBackendTexture& backendTexture,
                                        GrSurfaceOrigin origin,
                                        SkColorType colorType,
                                        SkAlphaType alphaType,
                                        sk_sp<SkColorSpace> colorSpace,
                                        TextureReleaseProc textureReleaseProc = nullptr,
                                        ReleaseContext releaseContext = nullptr);

/** Creates a GPU-backed SkImage from pixmap. It is uploaded to GPU backend using context.
    Created SkImage is available to other GPU contexts, and is available across thread
    boundaries. All contexts must be in the same GPU share group, or otherwise
    share resources.
    When SkImage is no longer referenced, context releases texture memory
    asynchronously.
    SkColorSpace of SkImage is determined by pixmap.colorSpace().
    SkImage is returned referring to GPU backend if context is not nullptr,
    format of data is recognized and supported, and if context supports moving
    resources between contexts. Otherwise, pixmap pixel data is copied and SkImage
    as returned in raster format if possible; nullptr may be returned.
    Recognized GPU formats vary by platform and GPU backend.
    @param context                GPU context
    @param pixmap                 SkImageInfo, pixel address, and row bytes
    @param buildMips              create SkImage as mip map if true
    @param limitToMaxTextureSize  downscale image to GPU maximum texture size, if necessary
    @return                       created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> CrossContextTextureFromPixmap(GrDirectContext* context,
                                                    const SkPixmap& pixmap,
                                                    bool buildMips,
                                                    bool limitToMaxTextureSize = false);

/** Creates a GPU-backed SkImage from a GPU backend texture. The backend texture must stay
    valid and unchanged until textureReleaseProc is called. The textureReleaseProc is
    called when the SkImage is deleted or no longer refers to the texture and will be
    passed the releaseContext.
    An SkImage is returned if the format of backendTexture is recognized and supported.
    Recognized formats vary by GPU backend.
    @note When using a DDL recording context, textureReleaseProc will be called on the
    GPU thread after the DDL is played back on the direct context.
    @param context             the GPU context
    @param backendTexture      a texture already allocated by the GPU
    @param alphaType           This characterizes the nature of the alpha values in the
                               backend texture. For opaque compressed formats (e.g., ETC1)
                               this should usually be set to kOpaq
                               ue_SkAlphaType.
    @param colorSpace          This describes the color space of this image's contents, as
                               seen after sampling. In general, if the format of the backend
                               texture is SRGB, some linear colorSpace should be supplied
                               (e.g., SkColorSpace::MakeSRGBLinear()). If the format of the
                               backend texture is linear, then the colorSpace should include
                               a description of the transfer function as
                               well (e.g., SkColorSpace::MakeSRGB()).
    @param textureReleaseProc  function called when the backend texture can be released
    @param releaseContext      state passed to textureReleaseProc
    @return                    created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> TextureFromCompressedTexture(GrRecordingContext* context,
                                                   const GrBackendTexture& backendTexture,
                                                   GrSurfaceOrigin origin,
                                                   SkAlphaType alphaType,
                                                   sk_sp<SkColorSpace> colorSpace,
                                                   TextureReleaseProc textureReleaseProc = nullptr,
                                                   ReleaseContext releaseContext = nullptr);

/** Creates a GPU-backed SkImage from compressed data.
    This method will return an SkImage representing the compressed data.
    If the GPU doesn't support the specified compression method, the data
    will be decompressed and then wrapped in a GPU-backed image.
    Note: one can query the supported compression formats via
    GrRecordingContext::compressedBackendFormat.
    @param context     GPU context
    @param data        compressed data to store in SkImage
    @param width       width of full SkImage
    @param height      height of full SkImage
    @param type        type of compression used
    @param mipmapped   does 'data' contain data for all the mipmap levels?
    @param isProtected do the contents of 'data' require DRM protection (on Vulkan)?
    @return            created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> TextureFromCompressedTextureData(GrDirectContext* direct,
                                                       sk_sp<SkData> data,
                                                       int width,
                                                       int height,
                                                       SkTextureCompressionType type,
                                                       GrMipmapped mipmapped = GrMipmapped::kNo,
                                                       GrProtected isProtected = GrProtected::kNo);

/** Returns SkImage backed by GPU texture associated with context. Returned SkImage is
    compatible with SkSurface created with dstColorSpace. The returned SkImage respects
    mipmapped setting; if mipmapped equals skgpu::Mipmapped::kYes, the backing texture
    allocates mip map levels.
    The mipmapped parameter is effectively treated as kNo if MIP maps are not supported by the
    GPU.
    Returns original SkImage if the image is already texture-backed, the context matches, and
    mipmapped is compatible with the backing GPU texture. skgpu::Budgeted is ignored in this
   case.
    Returns nullptr if context is nullptr, or if SkImage was created with another
    GrDirectContext.
    @param GrDirectContext  the GrDirectContext in play, if it exists
    @param SkImage          a non-null pointer to an SkImage.
    @param skgpu::Mipmapped Whether created SkImage texture must allocate mip map levels.
                            Defaults to no.
    @param skgpu::Budgeted  Whether to count a newly created texture for the returned image
                            counts against the context's budget. Defaults to yes.
    @return                 created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> TextureFromImage(GrDirectContext*,
                                       const SkImage*,
                                       skgpu::Mipmapped = skgpu::Mipmapped::kNo,
                                       skgpu::Budgeted = skgpu::Budgeted::kYes);
inline sk_sp<SkImage> TextureFromImage(GrDirectContext* ctx,
                                       sk_sp<const SkImage> img,
                                       skgpu::Mipmapped m = skgpu::Mipmapped::kNo,
                                       skgpu::Budgeted b = skgpu::Budgeted::kYes) {
    return TextureFromImage(ctx, img.get(), m, b);
}

/** Creates a GPU-backed SkImage from SkYUVAPixmaps.
    The image will remain planar with each plane converted to a texture using the passed
    GrRecordingContext.
    SkYUVAPixmaps has a SkYUVAInfo which specifies the transformation from YUV to RGB.
    The SkColorSpace of the resulting RGB values is specified by imageColorSpace. This will
    be the SkColorSpace reported by the image and when drawn the RGB values will be converted
    from this space into the destination space (if the destination is tagged).
    Currently, this is only supported using the GPU backend and will fail if context is nullptr.
    SkYUVAPixmaps does not need to remain valid after this returns.
    @param context                GPU context
    @param pixmaps                The planes as pixmaps with supported SkYUVAInfo that
                                  specifies conversion to RGB.
    @param buildMips              create internal YUVA textures as mip map if kYes. This is
                                  silently ignored if the context does not support mip maps.
    @param limitToMaxTextureSize  downscale image to GPU maximum texture size, if necessary
    @param imageColorSpace        range of colors of the resulting image; may be nullptr
    @return                       created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> TextureFromYUVAPixmaps(GrRecordingContext* context,
                                             const SkYUVAPixmaps& pixmaps,
                                             GrMipmapped buildMips,
                                             bool limitToMaxTextureSize,
                                             sk_sp<SkColorSpace> imageColorSpace);
SK_API sk_sp<SkImage> TextureFromYUVAPixmaps(GrRecordingContext* context,
                                             const SkYUVAPixmaps& pixmaps,
                                             GrMipmapped buildMips = GrMipmapped::kNo,
                                             bool limitToMaxTextureSize = false);

/** Creates a GPU-backed SkImage from YUV[A] planar textures. This requires that the textures
 *  stay valid for the lifetime of the image. The ReleaseContext can be used to know when it is
 *  safe to either delete or overwrite the textures. If ReleaseProc is provided it is also called
 *  before return on failure.
    @param context            GPU context
    @param yuvaTextures       A set of textures containing YUVA data and a description of the
                              data and transformation to RGBA.
    @param imageColorSpace    range of colors of the resulting image after conversion to RGB;
                              may be nullptr
    @param textureReleaseProc called when the backend textures can be released
    @param releaseContext     state passed to textureReleaseProc
    @return                   created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> TextureFromYUVATextures(GrRecordingContext* context,
                                              const GrYUVABackendTextures& yuvaTextures,
                                              sk_sp<SkColorSpace> imageColorSpace,
                                              TextureReleaseProc textureReleaseProc = nullptr,
                                              ReleaseContext releaseContext = nullptr);
SK_API sk_sp<SkImage> TextureFromYUVATextures(GrRecordingContext* context,
                                              const GrYUVABackendTextures& yuvaTextures);

using PromiseImageTextureContext = void*;
using PromiseImageTextureFulfillProc = sk_sp<SkPromiseImageTexture> (*)(PromiseImageTextureContext);
using PromiseImageTextureReleaseProc = void (*)(PromiseImageTextureContext);

/** Create a new GPU-backed SkImage that is very similar to an SkImage created by BorrowTextureFrom.
    The difference is that the caller need not have created the texture nor populated it with the
    image pixel data. Moreover, the SkImage may be created on a thread as the creation of the
    image does not require access to the backend API or GrDirectContext. Instead of passing a
    GrBackendTexture the client supplies a description of the texture consisting of
    GrBackendFormat, width, height, and GrMipmapped state. The resulting SkImage can be drawn
    to a SkDeferredDisplayListRecorder or directly to a GPU-backed SkSurface.
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
                                         GrMipmapped mipmapped,
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

/** Retrieves the existing backend texture. If SkImage is not a Ganesh-backend texture image
    or otherwise does not have such a texture, false is returned. Otherwise, outTexture will
    be set to the image's texture.

    If flushPendingGrContextIO is true, completes deferred I/O operations.
    If origin in not nullptr, copies location of content drawn into SkImage.
    @param outTexture               Will be set to the underlying texture of the image if non-null.
    @param flushPendingGrContextIO  flag to flush outstanding requests
    @param origin                   Will be set to the origin orientation of the image if non-null.
    @return                         false if a Ganesh backend texture cannot be retrieved.
*/
SK_API bool GetBackendTextureFromImage(const SkImage* img,
                                       GrBackendTexture* outTexture,
                                       bool flushPendingGrContextIO,
                                       GrSurfaceOrigin* origin = nullptr);
inline bool GetBackendTextureFromImage(sk_sp<const SkImage> img,
                                       GrBackendTexture* outTexture,
                                       bool flushPendingGrContextIO,
                                       GrSurfaceOrigin* origin = nullptr) {
    return GetBackendTextureFromImage(img.get(), outTexture, flushPendingGrContextIO, origin);
}

/** Extracts the backendTexture from an existing SkImage.
    If the image is not already GPU-backed, the raster data will be uploaded as a texture
    and returned.
    If this is the only reference to the image, the old image's texture will be
    moved out of the passed in image.
    If the image is shared (has a refcount > 1), the texture will be copied and then returned.
    @param context                    GPU context
    @param image                      image, either CPU-backed or GPU-backed
    @param backendTexture             Will be set to the underlying texture of the image.
    @param backendTextureReleaseProc  Called when the texture is released
    @return                           false if image cannot be uploaded.
*/
SK_API bool MakeBackendTextureFromImage(GrDirectContext* context,
                                        sk_sp<SkImage> image,
                                        GrBackendTexture* backendTexture,
                                        BackendTextureReleaseProc* backendTextureReleaseProc);
// Legacy name
inline bool GetBackendTextureFromImage(GrDirectContext* context,
                                       sk_sp<SkImage> image,
                                       GrBackendTexture* backendTexture,
                                       BackendTextureReleaseProc* backendTextureReleaseProc) {
    return MakeBackendTextureFromImage(context, std::move(image), backendTexture,
                                       backendTextureReleaseProc);
}

}  // namespace SkImages

#endif
