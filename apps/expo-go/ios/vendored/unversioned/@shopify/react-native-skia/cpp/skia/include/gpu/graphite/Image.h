/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_Image_DEFINED
#define skgpu_graphite_Image_DEFINED

#include "include/core/SkImage.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSpan.h"
#include "include/gpu/GpuTypes.h"

class SkYUVAInfo;
class SkYUVAPixmaps;
struct SkIRect;

namespace skgpu::graphite {
    class BackendTexture;
    class Recorder;
    class TextureInfo;
    class YUVABackendTextureInfo;
    class YUVABackendTextures;
    enum class Volatile : bool;
}

namespace SkImages {
using TextureReleaseProc = void (*)(ReleaseContext);

// Passed to both non-YUVA fulfill and imageRelease
using GraphitePromiseImageContext = void*;
// Passed to YUVA fulfill
using GraphitePromiseTextureContext = void*;
// Returned from fulfill and passed into textureRelease
using GraphitePromiseTextureReleaseContext = void*;

using GraphitePromiseImageFulfillProc =
        std::tuple<skgpu::graphite::BackendTexture, GraphitePromiseTextureReleaseContext> (*)(
                GraphitePromiseImageContext);
using GraphitePromiseImageYUVAFulfillProc =
        std::tuple<skgpu::graphite::BackendTexture, GraphitePromiseTextureReleaseContext> (*)(
                GraphitePromiseTextureContext);
using GraphitePromiseImageReleaseProc = void (*)(GraphitePromiseImageContext);
using GraphitePromiseTextureReleaseProc = void (*)(GraphitePromiseTextureReleaseContext);

/** Creates an SkImage from a GPU texture associated with the recorder.

    SkImage is returned if the format of backendTexture is recognized and supported.
    Recognized formats vary by GPU back-end.

    @param recorder            The recorder
    @param backendTexture      texture residing on GPU
    @param colorSpace          This describes the color space of this image's contents, as
                               seen after sampling. In general, if the format of the backend
                               texture is SRGB, some linear colorSpace should be supplied
                               (e.g., SkColorSpace::MakeSRGBLinear()). If the format of the
                               backend texture is linear, then the colorSpace should include
                               a description of the transfer function as
                               well (e.g., SkColorSpace::MakeSRGB()).
    @param origin              Whether the Texture logically treats the origin as TopLeft or
                               BottomLeft
    @return                    created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> AdoptTextureFrom(skgpu::graphite::Recorder*,
                                       const skgpu::graphite::BackendTexture&,
                                       SkColorType colorType,
                                       SkAlphaType alphaType,
                                       sk_sp<SkColorSpace> colorSpace,
                                       skgpu::Origin origin,
                                       TextureReleaseProc = nullptr,
                                       ReleaseContext = nullptr);

SK_API sk_sp<SkImage> AdoptTextureFrom(skgpu::graphite::Recorder*,
                                       const skgpu::graphite::BackendTexture&,
                                       SkColorType colorType,
                                       SkAlphaType alphaType,
                                       sk_sp<SkColorSpace> colorSpace,
                                       TextureReleaseProc = nullptr,
                                       ReleaseContext = nullptr);

/** Create a new SkImage that is very similar to an SkImage created by
    AdoptTextureFrom. The difference is that the caller need not have created the
    backend texture nor populated it with data when creating the image. Instead of passing a
    BackendTexture to the factory the client supplies a description of the texture consisting
    of dimensions, TextureInfo, SkColorInfo and Volatility.

    In general, 'fulfill' must return a BackendTexture that matches the properties
    provided at SkImage creation time. The BackendTexture must refer to a valid existing
    texture in the backend API context/device, and already be populated with data.
    The texture cannot be deleted until 'textureRelease' is called. 'textureRelease' will
    be called with the textureReleaseContext returned by 'fulfill'.

    Wrt when and how often the fulfill, imageRelease, and textureRelease callbacks will
    be called:

    For non-volatile promise images, 'fulfill' will be called at Context::insertRecording
    time. Regardless of whether 'fulfill' succeeded or failed, 'imageRelease' will always be
    called only once - when Skia will no longer try calling 'fulfill' to get a backend
    texture. If 'fulfill' failed (i.e., it didn't return a valid backend texture) then
    'textureRelease' will never be called. If 'fulfill' was successful then
    'textureRelease' will be called only once when the GPU is done with the contents of the
    promise image. This will usually occur during a Context::submit call but it could occur
    earlier due to error conditions. 'fulfill' can be called multiple times if the promise
    image is used in multiple recordings. If 'fulfill' fails, the insertRecording itself will
    fail. Subsequent insertRecording calls (with Recordings that use the promise image) will
    keep calling 'fulfill' until it succeeds.

    For volatile promise images, 'fulfill' will be called each time the Recording is inserted
    into a Context. Regardless of whether 'fulfill' succeeded or failed, 'imageRelease'
    will always be called only once just like the non-volatile case. If 'fulfill' fails at
    insertRecording-time, 'textureRelease' will never be called. If 'fulfill' was successful
    then a 'textureRelease' matching that 'fulfill' will be called when the GPU is done with
    the contents of the promise image. This will usually occur during a Context::submit call
    but it could occur earlier due to error conditions.

    @param recorder       the recorder that will capture the commands creating the image
    @param dimensions     width & height of promised gpu texture
    @param textureInfo    structural information for the promised gpu texture
    @param colorInfo      color type, alpha type and colorSpace information for the image
    @param origin         Whether the Texture logically treats the origin as TopLeft or BottomLeft
    @param isVolatile     volatility of the promise image
    @param fulfill        function called to get the actual backend texture,
                          and the instance for the GraphitePromiseTextureReleaseProc
    @param imageRelease   function called when any image-centric data can be deleted
    @param textureRelease function called when the backend texture can be deleted
    @param imageContext   state passed to fulfill and imageRelease
    @return               created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> PromiseTextureFrom(skgpu::graphite::Recorder*,
                                         SkISize dimensions,
                                         const skgpu::graphite::TextureInfo&,
                                         const SkColorInfo&,
                                         skgpu::Origin origin,
                                         skgpu::graphite::Volatile,
                                         GraphitePromiseImageFulfillProc,
                                         GraphitePromiseImageReleaseProc,
                                         GraphitePromiseTextureReleaseProc,
                                         GraphitePromiseImageContext);

SK_API sk_sp<SkImage> PromiseTextureFrom(skgpu::graphite::Recorder*,
                                         SkISize dimensions,
                                         const skgpu::graphite::TextureInfo&,
                                         const SkColorInfo&,
                                         skgpu::graphite::Volatile,
                                         GraphitePromiseImageFulfillProc,
                                         GraphitePromiseImageReleaseProc,
                                         GraphitePromiseTextureReleaseProc,
                                         GraphitePromiseImageContext);

/** This is similar to 'PromiseTextureFrom' but it creates a GPU-backed SkImage from YUV[A] data.
    The source data may be planar (i.e. spread across multiple textures). In
    the extreme Y, U, V, and A are all in different planes and thus the image is specified by
    four textures. 'backendTextureInfo' describes the planar arrangement, texture formats,
    and conversion to RGB. Separate 'fulfill' and 'textureRelease' calls are made for each texture.
    Each texture has its own GraphitePromiseTextureContext. The GraphitePromiseImageReleaseProc
    will be made even on failure. 'textureContexts' has one entry for each of the up to four
    textures, as indicated by 'backendTextureInfo'. Currently the mipmapped property of
    'backendTextureInfo' is ignored. However, in the near future it will be required that if it is
    kYes then the fulfillProc must return a mip mapped texture for each plane in order to
    successfully draw the image.
    @param recorder            the recorder that will capture the commands creating the image
    @param backendTextureInfo  info about the promised yuva gpu texture(s)
    @param imageColorSpace     range of colors; may be nullptr
    @param isVolatile          volatility of the promise image
    @param fulfill             function called to get the actual backend texture for
                               a given GraphitePromiseTextureContext, and the instance
                               for the GraphitePromiseTextureReleaseProc
    @param imageRelease        function called when any image-centric data can be deleted
    @param textureRelease      function called when the backend texture can be deleted
    @param imageContext        state passed to imageRelease
    @param textureContexts     states passed to fulfill and textureRelease
    @return                    created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> PromiseTextureFromYUVA(skgpu::graphite::Recorder*,
                                             const skgpu::graphite::YUVABackendTextureInfo&,
                                             sk_sp<SkColorSpace> imageColorSpace,
                                             skgpu::graphite::Volatile,
                                             GraphitePromiseImageYUVAFulfillProc,
                                             GraphitePromiseImageReleaseProc,
                                             GraphitePromiseTextureReleaseProc,
                                             GraphitePromiseImageContext imageContext,
                                             GraphitePromiseTextureContext textureContexts[]);


/** Returns an SkImage backed by a Graphite texture, using the provided Recorder for creation
    and uploads if necessary. The returned SkImage respects the required image properties'
    mipmap setting for non-Graphite SkImages; i.e., if mipmapping is required, the backing
    Graphite texture will have allocated mip map levels.

    It is assumed that MIP maps are always supported by the GPU.

    Returns original SkImage if the image is already Graphite-backed and the required mipmapping
    is compatible with the backing Graphite texture. If the required mipmapping is not
    compatible, nullptr will be returned.

    Returns nullptr if no Recorder is provided, or if SkImage was created with another
    Recorder and work on that Recorder has not been submitted.

    @param Recorder            the Recorder to use for storing commands
    @param RequiredProperties  properties the returned SkImage must possess (e.g. mipmaps)
    @return                    created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> TextureFromImage(skgpu::graphite::Recorder*,
                                       const SkImage*,
                                       SkImage::RequiredProperties = {});

inline sk_sp<SkImage> TextureFromImage(skgpu::graphite::Recorder* r,
                                       sk_sp<const SkImage> img,
                                       SkImage::RequiredProperties props = {}) {
    return TextureFromImage(r, img.get(), props);
}

/** Creates SkImage from SkYUVAPixmaps.

    The image will remain planar with each plane converted to a texture using the passed
    Recorder.

    SkYUVAPixmaps has a SkYUVAInfo which specifies the transformation from YUV to RGB.
    The SkColorSpace of the resulting RGB values is specified by imgColorSpace. This will
    be the SkColorSpace reported by the image and when drawn the RGB values will be converted
    from this space into the destination space (if the destination is tagged).

    This is only supported using the GPU backend and will fail if recorder is nullptr.

    SkYUVAPixmaps does not need to remain valid after this returns.

    @param Recorder                 The Recorder to use for storing commands
    @param pixmaps                  The planes as pixmaps with supported SkYUVAInfo that
                                    specifies conversion to RGB.
    @param RequiredProperties       Properties the returned SkImage must possess (e.g. mipmaps)
    @param limitToMaxTextureSize    Downscale image to GPU maximum texture size, if necessary
    @param imgColorSpace            Range of colors of the resulting image; may be nullptr
    @return                         Created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> TextureFromYUVAPixmaps(skgpu::graphite::Recorder*,
                                             const SkYUVAPixmaps& pixmaps,
                                             SkImage::RequiredProperties = {},
                                             bool limitToMaxTextureSize = false,
                                             sk_sp<SkColorSpace> imgColorSpace = nullptr);

/** Creates an SkImage from YUV[A] planar textures associated with the recorder.
     @param recorder            The recorder.
     @param yuvaBackendTextures A set of textures containing YUVA data and a description of the
                                data and transformation to RGBA.
     @param imageColorSpace     range of colors of the resulting image after conversion to RGB;
                                may be nullptr
     @param TextureReleaseProc  called when the backend textures can be released
     @param ReleaseContext      state passed to TextureReleaseProc
     @return                    created SkImage, or nullptr
 */
SK_API sk_sp<SkImage> TextureFromYUVATextures(
        skgpu::graphite::Recorder* recorder,
        const skgpu::graphite::YUVABackendTextures& yuvaBackendTextures,
        sk_sp<SkColorSpace> imageColorSpace,
        TextureReleaseProc = nullptr,
        ReleaseContext = nullptr);

/** Creates an SkImage from YUV[A] planar SkImages associated with the recorder.

    The images should have kGraphite type, and the result will be nullptr if any are not.
    The resulting SkImage will not take a ref on the given SkImages but will take a ref on
    the underlying TextureProxies. The releaseProcs, if any, for those Textures will be the
    ones set when the given SkImages were created.

     @param recorder            The recorder.
     @param yuvaInfo            Structure describing the YUVA format
     @param images              A set of SkImages containing YUVA data
     @param imageColorSpace     Range of colors of the resulting image after conversion to RGB;
                                may be nullptr
     @return                    created SkImage, or nullptr
 */
SK_API sk_sp<SkImage> TextureFromYUVAImages(
        skgpu::graphite::Recorder* recorder,
        const SkYUVAInfo& yuvaInfo,
        SkSpan<const sk_sp<SkImage>> images,
        sk_sp<SkColorSpace> imageColorSpace);

/** Returns subset of this image as a texture-backed image.

    Returns nullptr if any of the following are true:
      - Subset is empty
      - Subset is not contained inside the image's bounds
      - Pixels in the source image could not be read or copied
      - The source image is texture-backed and context does not match the source image's context.

    @param recorder the non-null recorder in which to create the new image.
    @param img     Source image
    @param subset  bounds of returned SkImage
    @param props   properties the returned SkImage must possess (e.g. mipmaps)
    @return        the subsetted image, uploaded as a texture, or nullptr
*/
SK_API sk_sp<SkImage> SubsetTextureFrom(skgpu::graphite::Recorder* recorder,
                                        const SkImage* img,
                                        const SkIRect& subset,
                                        SkImage::RequiredProperties props = {});

/** Creates a filtered SkImage on the GPU. filter processes the src image, potentially changing
    color, position, and size. subset is the bounds of src that are processed
    by filter. clipBounds is the expected bounds of the filtered SkImage. outSubset
    is required storage for the actual bounds of the filtered SkImage. offset is
    required storage for translation of returned SkImage.

    Returns nullptr if SkImage could not be created. If nullptr is returned, outSubset
    and offset are undefined.

    Useful for animation of SkImageFilter that varies size from frame to frame.
    Returned SkImage is created larger than required by filter so that GPU texture
    can be reused with different sized effects. outSubset describes the valid bounds
    of GPU texture returned. offset translates the returned SkImage to keep subsequent
    animation frames aligned with respect to each other.

    @param recorder    the recorder in which the filtering operation is to be performed
    @param filter      how SkImage is sampled when transformed
    @param subset      bounds of SkImage processed by filter
    @param clipBounds  expected bounds of filtered SkImage
    @param outSubset   storage for returned SkImage bounds
    @param offset      storage for returned SkImage translation
    @return            filtered SkImage, or nullptr
*/
SK_API sk_sp<SkImage> MakeWithFilter(skgpu::graphite::Recorder* recorder,
                                     sk_sp<SkImage> src,
                                     const SkImageFilter* filter,
                                     const SkIRect& subset,
                                     const SkIRect& clipBounds,
                                     SkIRect* outSubset,
                                     SkIPoint* offset);

} // namespace SkImages


#endif // skgpu_graphite_Image_DEFINED
