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

class GrBackendTexture;
class GrDirectContext;
class GrRecordingContext;
class GrYUVABackendTextures;
class SkColorSpace;
class SkData;
class SkImageFilter;
struct SkIPoint;
class SkPixmap;
class SkYUVAPixmaps;
enum SkAlphaType : int;
enum SkColorType : int;
enum class SkTextureCompressionType;
struct SkIRect;

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
SK_API sk_sp<SkImage> TextureFromCompressedTextureData(
        GrDirectContext* direct,
        sk_sp<SkData> data,
        int width,
        int height,
        SkTextureCompressionType type,
        skgpu::Mipmapped mipmapped = skgpu::Mipmapped::kNo,
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
                                             skgpu::Mipmapped buildMips,
                                             bool limitToMaxTextureSize,
                                             sk_sp<SkColorSpace> imageColorSpace);
SK_API sk_sp<SkImage> TextureFromYUVAPixmaps(GrRecordingContext* context,
                                             const SkYUVAPixmaps& pixmaps,
                                             skgpu::Mipmapped buildMips = skgpu::Mipmapped::kNo,
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

/** Returns subset of this image as a texture-backed image.

    Returns nullptr if any of the following are true:
      - Subset is empty
      - Subset is not contained inside the image's bounds
      - Pixels in the source image could not be read or copied
      - The source image is texture-backed and context does not match the source image's context.

    @param context the non-null GrDirectContext to which the subset should be uploaded.
    @param subset  bounds of returned SkImage
    @return        the subsetted image, uploaded as a texture, or nullptr
*/
SK_API sk_sp<SkImage> SubsetTextureFrom(GrDirectContext* context,
                                        const SkImage* img,
                                        const SkIRect& subset);

/** Creates a filtered SkImage on the GPU. filter processes the src image, potentially changing
    color, position, and size. subset is the bounds of src that are processed
    by filter. clipBounds is the expected bounds of the filtered SkImage. outSubset
    is required storage for the actual bounds of the filtered SkImage. offset is
    required storage for translation of returned SkImage.

    Returns nullptr if SkImage could not be created or if the recording context provided doesn't
    match the GPU context in which the image was created. If nullptr is returned, outSubset
    and offset are undefined.

    Useful for animation of SkImageFilter that varies size from frame to frame.
    Returned SkImage is created larger than required by filter so that GPU texture
    can be reused with different sized effects. outSubset describes the valid bounds
    of GPU texture returned. offset translates the returned SkImage to keep subsequent
    animation frames aligned with respect to each other.

    @param context     the GrRecordingContext in play - if it exists
    @param filter      how SkImage is sampled when transformed
    @param subset      bounds of SkImage processed by filter
    @param clipBounds  expected bounds of filtered SkImage
    @param outSubset   storage for returned SkImage bounds
    @param offset      storage for returned SkImage translation
    @return            filtered SkImage, or nullptr
*/
SK_API sk_sp<SkImage> MakeWithFilter(GrRecordingContext* context,
                                     sk_sp<SkImage> src,
                                     const SkImageFilter* filter,
                                     const SkIRect& subset,
                                     const SkIRect& clipBounds,
                                     SkIRect* outSubset,
                                     SkIPoint* offset);

}  // namespace SkImages

#endif
