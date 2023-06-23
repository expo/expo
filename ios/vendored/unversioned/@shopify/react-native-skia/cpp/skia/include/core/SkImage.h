/*
 * Copyright 2012 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkImage_DEFINED
#define SkImage_DEFINED

#include "include/core/SkAlphaType.h"
#include "include/core/SkImageInfo.h"
#include "include/core/SkRect.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSize.h"
#include "include/private/base/SkAPI.h"

#if defined(SK_GRAPHITE)
#include "include/gpu/graphite/GraphiteTypes.h"
class SkYUVAPixmaps;
#endif

#include <cstddef>
#include <cstdint>
#include <memory>
#include <optional>

class GrDirectContext;
class GrRecordingContext;
class SkBitmap;
class SkColorSpace;
class SkData;
class SkImage;
class SkImageFilter;
class SkImageGenerator;
class SkMatrix;
class SkMipmap;
class SkPaint;
class SkPicture;
class SkPixmap;
class SkShader;
class SkSurfaceProps;
enum SkColorType : int;
enum class SkTextureCompressionType;
enum class SkTileMode;

struct SkIPoint;
struct SkSamplingOptions;

#if defined(SK_GRAPHITE)
namespace skgpu::graphite {
class BackendTexture;
class Recorder;
class TextureInfo;
enum class Volatile : bool;
class YUVABackendTextures;
}
#endif

namespace SkImages {

/** Caller data passed to RasterReleaseProc; may be nullptr. */
using ReleaseContext = void*;
/** Function called when SkImage no longer shares pixels. ReleaseContext is
    provided by caller when SkImage is created, and may be nullptr.
*/
using RasterReleaseProc = void(const void* pixels, ReleaseContext);

/** Creates a CPU-backed SkImage from bitmap, sharing or copying bitmap pixels. If the bitmap
    is marked immutable, and its pixel memory is shareable, it may be shared
    instead of copied.

    SkImage is returned if bitmap is valid. Valid SkBitmap parameters include:
    dimensions are greater than zero;
    each dimension fits in 29 bits;
    SkColorType and SkAlphaType are valid, and SkColorType is not kUnknown_SkColorType;
    row bytes are large enough to hold one row of pixels;
    pixel address is not nullptr.

    @param bitmap  SkImageInfo, row bytes, and pixels
    @return        created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> RasterFromBitmap(const SkBitmap& bitmap);

/** Creates a CPU-backed SkImage from compressed data.

    This method will decompress the compressed data and create an image wrapping
    it. Any mipmap levels present in the compressed data are discarded.

    @param data     compressed data to store in SkImage
    @param width    width of full SkImage
    @param height   height of full SkImage
    @param type     type of compression used
    @return         created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> RasterFromCompressedTextureData(sk_sp<SkData> data,
                                                      int width,
                                                      int height,
                                                      SkTextureCompressionType type);

/**
 *  Return a SkImage using the encoded data, but attempts to defer decoding until the
 *  image is actually used/drawn. This deferral allows the system to cache the result, either on the
 *  CPU or on the GPU, depending on where the image is drawn. If memory is low, the cache may
 *  be purged, causing the next draw of the image to have to re-decode.
 *
 *  If alphaType is nullopt, the image's alpha type will be chosen automatically based on the
 *  image format. Transparent images will default to kPremul_SkAlphaType. If alphaType contains
 *  kPremul_SkAlphaType or kUnpremul_SkAlphaType, that alpha type will be used. Forcing opaque
 *  (passing kOpaque_SkAlphaType) is not allowed, and will return nullptr.
 *
 *  If the encoded format is not supported, nullptr is returned.
 *
 *  @param encoded  the encoded data
 *  @return         created SkImage, or nullptr

    example: https://fiddle.skia.org/c/@Image_DeferredFromEncodedData
*/
SK_API sk_sp<SkImage> DeferredFromEncodedData(sk_sp<SkData> encoded,
                                              std::optional<SkAlphaType> alphaType = std::nullopt);

/** Creates SkImage from data returned by imageGenerator. The image data will not be created
    (on either the CPU or GPU) until the image is actually drawn.
    Generated data is owned by SkImage and may not be shared or accessed.

    SkImage is returned if generator data is valid. Valid data parameters vary by type of data
    and platform.

    imageGenerator may wrap SkPicture data, codec data, or custom data.

    @param imageGenerator  stock or custom routines to retrieve SkImage
    @return                created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> DeferredFromGenerator(std::unique_ptr<SkImageGenerator> imageGenerator);

enum class BitDepth {
    kU8,   //!< uses 8-bit unsigned int per color component
    kF16,  //!< uses 16-bit float per color component
};

/** Creates SkImage from picture. Returned SkImage width and height are set by dimensions.
    SkImage draws picture with matrix and paint, set to bitDepth and colorSpace.

    The Picture data is not turned into an image (CPU or GPU) until it is drawn.

    If matrix is nullptr, draws with identity SkMatrix. If paint is nullptr, draws
    with default SkPaint. colorSpace may be nullptr.

    @param picture     stream of drawing commands
    @param dimensions  width and height
    @param matrix      SkMatrix to rotate, scale, translate, and so on; may be nullptr
    @param paint       SkPaint to apply transparency, filtering, and so on; may be nullptr
    @param bitDepth    8-bit integer or 16-bit float: per component
    @param colorSpace  range of colors; may be nullptr
    @param props       props to use when rasterizing the picture
    @return            created SkImage, or nullptr
*/
SK_API sk_sp<SkImage> DeferredFromPicture(sk_sp<SkPicture> picture,
                                          const SkISize& dimensions,
                                          const SkMatrix* matrix,
                                          const SkPaint* paint,
                                          BitDepth bitDepth,
                                          sk_sp<SkColorSpace> colorSpace,
                                          SkSurfaceProps props);
SK_API sk_sp<SkImage> DeferredFromPicture(sk_sp<SkPicture> picture,
                                          const SkISize& dimensions,
                                          const SkMatrix* matrix,
                                          const SkPaint* paint,
                                          BitDepth bitDepth,
                                          sk_sp<SkColorSpace> colorSpace);

/** Creates a CPU-backed SkImage from pixmap, copying the pixel data.
    As a result, pixmap pixels may be modified or deleted without affecting SkImage.

    SkImage is returned if SkPixmap is valid. Valid SkPixmap parameters include:
    dimensions are greater than zero;
    each dimension fits in 29 bits;
    SkColorType and SkAlphaType are valid, and SkColorType is not kUnknown_SkColorType;
    row bytes are large enough to hold one row of pixels;
    pixel address is not nullptr.

    @param pixmap  SkImageInfo, pixel address, and row bytes
    @return        copy of SkPixmap pixels, or nullptr

    example: https://fiddle.skia.org/c/@Image_RasterFromPixmapCopy
*/
SK_API sk_sp<SkImage> RasterFromPixmapCopy(const SkPixmap& pixmap);

/** Creates CPU-backed SkImage from pixmap, sharing SkPixmap pixels. Pixels must remain valid and
    unchanged until rasterReleaseProc is called. rasterReleaseProc is passed
    releaseContext when SkImage is deleted or no longer refers to pixmap pixels.

    Pass nullptr for rasterReleaseProc to share SkPixmap without requiring a callback
    when SkImage is released. Pass nullptr for releaseContext if rasterReleaseProc
    does not require state.

    SkImage is returned if pixmap is valid. Valid SkPixmap parameters include:
    dimensions are greater than zero;
    each dimension fits in 29 bits;
    SkColorType and SkAlphaType are valid, and SkColorType is not kUnknown_SkColorType;
    row bytes are large enough to hold one row of pixels;
    pixel address is not nullptr.

    @param pixmap             SkImageInfo, pixel address, and row bytes
    @param rasterReleaseProc  function called when pixels can be released; or nullptr
    @param releaseContext     state passed to rasterReleaseProc; or nullptr
    @return                   SkImage sharing pixmap
*/
SK_API sk_sp<SkImage> RasterFromPixmap(const SkPixmap& pixmap,
                                       RasterReleaseProc rasterReleaseProc,
                                       ReleaseContext releaseContext);

/** Creates CPU-backed SkImage from pixel data described by info.
    The pixels data will *not* be copied.

    SkImage is returned if SkImageInfo is valid. Valid SkImageInfo parameters include:
    dimensions are greater than zero;
    each dimension fits in 29 bits;
    SkColorType and SkAlphaType are valid, and SkColorType is not kUnknown_SkColorType;
    rowBytes are large enough to hold one row of pixels;
    pixels is not nullptr, and contains enough data for SkImage.

    @param info      contains width, height, SkAlphaType, SkColorType, SkColorSpace
    @param pixels    address or pixel storage
    @param rowBytes  size of pixel row or larger
    @return          SkImage sharing pixels, or nullptr
*/
SK_API sk_sp<SkImage> RasterFromData(const SkImageInfo& info,
                                     sk_sp<SkData> pixels,
                                     size_t rowBytes);

}  // namespace SkImages

/** \class SkImage
    SkImage describes a two dimensional array of pixels to draw. The pixels may be
    decoded in a raster bitmap, encoded in a SkPicture or compressed data stream,
    or located in GPU memory as a GPU texture.

    SkImage cannot be modified after it is created. SkImage may allocate additional
    storage as needed; for instance, an encoded SkImage may decode when drawn.

    SkImage width and height are greater than zero. Creating an SkImage with zero width
    or height returns SkImage equal to nullptr.

    SkImage may be created from SkBitmap, SkPixmap, SkSurface, SkPicture, encoded streams,
    GPU texture, YUV_ColorSpace data, or hardware buffer. Encoded streams supported
    include BMP, GIF, HEIF, ICO, JPEG, PNG, WBMP, WebP. Supported encoding details
    vary with platform.

    See SkImages namespace for the static factory methods to make SkImages.

    Clients should *not* subclass SkImage as there is a lot of internal machinery that is
    not publicly accessible.
*/
class SK_API SkImage : public SkRefCnt {
public:
    /** Returns a SkImageInfo describing the width, height, color type, alpha type, and color space
        of the SkImage.

        @return  image info of SkImage.
    */
    const SkImageInfo& imageInfo() const { return fInfo; }

    /** Returns pixel count in each row.

        @return  pixel width in SkImage
    */
    int width() const { return fInfo.width(); }

    /** Returns pixel row count.

        @return  pixel height in SkImage
    */
    int height() const { return fInfo.height(); }

    /** Returns SkISize { width(), height() }.

        @return  integral size of width() and height()
    */
    SkISize dimensions() const { return SkISize::Make(fInfo.width(), fInfo.height()); }

    /** Returns SkIRect { 0, 0, width(), height() }.

        @return  integral rectangle from origin to width() and height()
    */
    SkIRect bounds() const { return SkIRect::MakeWH(fInfo.width(), fInfo.height()); }

    /** Returns value unique to image. SkImage contents cannot change after SkImage is
        created. Any operation to create a new SkImage will receive generate a new
        unique number.

        @return  unique identifier
    */
    uint32_t uniqueID() const { return fUniqueID; }

    /** Returns SkAlphaType.

        SkAlphaType returned was a parameter to an SkImage constructor,
        or was parsed from encoded data.

        @return  SkAlphaType in SkImage

        example: https://fiddle.skia.org/c/@Image_alphaType
    */
    SkAlphaType alphaType() const;

    /** Returns SkColorType if known; otherwise, returns kUnknown_SkColorType.

        @return  SkColorType of SkImage

        example: https://fiddle.skia.org/c/@Image_colorType
    */
    SkColorType colorType() const;

    /** Returns SkColorSpace, the range of colors, associated with SkImage.  The
        reference count of SkColorSpace is unchanged. The returned SkColorSpace is
        immutable.

        SkColorSpace returned was passed to an SkImage constructor,
        or was parsed from encoded data. SkColorSpace returned may be ignored when SkImage
        is drawn, depending on the capabilities of the SkSurface receiving the drawing.

        @return  SkColorSpace in SkImage, or nullptr

        example: https://fiddle.skia.org/c/@Image_colorSpace
    */
    SkColorSpace* colorSpace() const;

    /** Returns a smart pointer to SkColorSpace, the range of colors, associated with
        SkImage.  The smart pointer tracks the number of objects sharing this
        SkColorSpace reference so the memory is released when the owners destruct.

        The returned SkColorSpace is immutable.

        SkColorSpace returned was passed to an SkImage constructor,
        or was parsed from encoded data. SkColorSpace returned may be ignored when SkImage
        is drawn, depending on the capabilities of the SkSurface receiving the drawing.

        @return  SkColorSpace in SkImage, or nullptr, wrapped in a smart pointer

        example: https://fiddle.skia.org/c/@Image_refColorSpace
    */
    sk_sp<SkColorSpace> refColorSpace() const;

    /** Returns true if SkImage pixels represent transparency only. If true, each pixel
        is packed in 8 bits as defined by kAlpha_8_SkColorType.

        @return  true if pixels represent a transparency mask

        example: https://fiddle.skia.org/c/@Image_isAlphaOnly
    */
    bool isAlphaOnly() const;

    /** Returns true if pixels ignore their alpha value and are treated as fully opaque.

        @return  true if SkAlphaType is kOpaque_SkAlphaType
    */
    bool isOpaque() const { return SkAlphaTypeIsOpaque(this->alphaType()); }

    /**
     *  Make a shader with the specified tiling and mipmap sampling.
     */
    sk_sp<SkShader> makeShader(SkTileMode tmx, SkTileMode tmy, const SkSamplingOptions&,
                               const SkMatrix* localMatrix = nullptr) const;
    sk_sp<SkShader> makeShader(SkTileMode tmx, SkTileMode tmy, const SkSamplingOptions& sampling,
                               const SkMatrix& lm) const;
    /** Defaults to clamp in both X and Y. */
    sk_sp<SkShader> makeShader(const SkSamplingOptions& sampling, const SkMatrix& lm) const;
    sk_sp<SkShader> makeShader(const SkSamplingOptions& sampling,
                               const SkMatrix* lm = nullptr) const;

    /**
     *  makeRawShader functions like makeShader, but for images that contain non-color data.
     *  This includes images encoding things like normals, material properties (eg, roughness),
     *  heightmaps, or any other purely mathematical data that happens to be stored in an image.
     *  These types of images are useful with some programmable shaders (see: SkRuntimeEffect).
     *
     *  Raw image shaders work like regular image shaders (including filtering and tiling), with
     *  a few major differences:
     *    - No color space transformation is ever applied (the color space of the image is ignored).
     *    - Images with an alpha type of kUnpremul are *not* automatically premultiplied.
     *    - Bicubic filtering is not supported. If SkSamplingOptions::useCubic is true, these
     *      factories will return nullptr.
     */
    sk_sp<SkShader> makeRawShader(SkTileMode tmx, SkTileMode tmy, const SkSamplingOptions&,
                                  const SkMatrix* localMatrix = nullptr) const;
    sk_sp<SkShader> makeRawShader(SkTileMode tmx, SkTileMode tmy, const SkSamplingOptions& sampling,
                                  const SkMatrix& lm) const;
    /** Defaults to clamp in both X and Y. */
    sk_sp<SkShader> makeRawShader(const SkSamplingOptions& sampling, const SkMatrix& lm) const;
    sk_sp<SkShader> makeRawShader(const SkSamplingOptions& sampling,
                                  const SkMatrix* lm = nullptr) const;

    /** Copies SkImage pixel address, row bytes, and SkImageInfo to pixmap, if address
        is available, and returns true. If pixel address is not available, return
        false and leave pixmap unchanged.

        @param pixmap  storage for pixel state if pixels are readable; otherwise, ignored
        @return        true if SkImage has direct access to pixels

        example: https://fiddle.skia.org/c/@Image_peekPixels
    */
    bool peekPixels(SkPixmap* pixmap) const;

    /** Returns true if the contents of SkImage was created on or uploaded to GPU memory,
        and is available as a GPU texture.

        @return  true if SkImage is a GPU texture

        example: https://fiddle.skia.org/c/@Image_isTextureBacked
    */
    virtual bool isTextureBacked() const = 0;

    /** Returns an approximation of the amount of texture memory used by the image. Returns
        zero if the image is not texture backed or if the texture has an external format.
     */
    virtual size_t textureSize() const = 0;

    /** Returns true if SkImage can be drawn on either raster surface or GPU surface.
        If context is nullptr, tests if SkImage draws on raster surface;
        otherwise, tests if SkImage draws on GPU surface associated with context.

        SkImage backed by GPU texture may become invalid if associated context is
        invalid. lazy image may be invalid and may not draw to raster surface or
        GPU surface or both.

        @param context  GPU context
        @return         true if SkImage can be drawn

        example: https://fiddle.skia.org/c/@Image_isValid
    */
    virtual bool isValid(GrRecordingContext* context) const = 0;

    /** \enum SkImage::CachingHint
        CachingHint selects whether Skia may internally cache SkBitmap generated by
        decoding SkImage, or by copying SkImage from GPU to CPU. The default behavior
        allows caching SkBitmap.

        Choose kDisallow_CachingHint if SkImage pixels are to be used only once, or
        if SkImage pixels reside in a cache outside of Skia, or to reduce memory pressure.

        Choosing kAllow_CachingHint does not ensure that pixels will be cached.
        SkImage pixels may not be cached if memory requirements are too large or
        pixels are not accessible.
    */
    enum CachingHint {
        kAllow_CachingHint,    //!< allows internally caching decoded and copied pixels
        kDisallow_CachingHint, //!< disallows internally caching decoded and copied pixels
    };

    /** Copies SkRect of pixels from SkImage to dstPixels. Copy starts at offset (srcX, srcY),
        and does not exceed SkImage (width(), height()).

        dstInfo specifies width, height, SkColorType, SkAlphaType, and SkColorSpace of
        destination. dstRowBytes specifies the gap from one destination row to the next.
        Returns true if pixels are copied. Returns false if:
        - dstInfo.addr() equals nullptr
        - dstRowBytes is less than dstInfo.minRowBytes()
        - SkPixelRef is nullptr

        Pixels are copied only if pixel conversion is possible. If SkImage SkColorType is
        kGray_8_SkColorType, or kAlpha_8_SkColorType; dstInfo.colorType() must match.
        If SkImage SkColorType is kGray_8_SkColorType, dstInfo.colorSpace() must match.
        If SkImage SkAlphaType is kOpaque_SkAlphaType, dstInfo.alphaType() must
        match. If SkImage SkColorSpace is nullptr, dstInfo.colorSpace() must match. Returns
        false if pixel conversion is not possible.

        srcX and srcY may be negative to copy only top or left of source. Returns
        false if width() or height() is zero or negative.
        Returns false if abs(srcX) >= Image width(), or if abs(srcY) >= Image height().

        If cachingHint is kAllow_CachingHint, pixels may be retained locally.
        If cachingHint is kDisallow_CachingHint, pixels are not added to the local cache.

        @param context      the GrDirectContext in play, if it exists
        @param dstInfo      destination width, height, SkColorType, SkAlphaType, SkColorSpace
        @param dstPixels    destination pixel storage
        @param dstRowBytes  destination row length
        @param srcX         column index whose absolute value is less than width()
        @param srcY         row index whose absolute value is less than height()
        @param cachingHint  whether the pixels should be cached locally
        @return             true if pixels are copied to dstPixels
    */
    bool readPixels(GrDirectContext* context,
                    const SkImageInfo& dstInfo,
                    void* dstPixels,
                    size_t dstRowBytes,
                    int srcX, int srcY,
                    CachingHint cachingHint = kAllow_CachingHint) const;

    /** Copies a SkRect of pixels from SkImage to dst. Copy starts at (srcX, srcY), and
        does not exceed SkImage (width(), height()).

        dst specifies width, height, SkColorType, SkAlphaType, SkColorSpace, pixel storage,
        and row bytes of destination. dst.rowBytes() specifics the gap from one destination
        row to the next. Returns true if pixels are copied. Returns false if:
        - dst pixel storage equals nullptr
        - dst.rowBytes is less than SkImageInfo::minRowBytes
        - SkPixelRef is nullptr

        Pixels are copied only if pixel conversion is possible. If SkImage SkColorType is
        kGray_8_SkColorType, or kAlpha_8_SkColorType; dst.colorType() must match.
        If SkImage SkColorType is kGray_8_SkColorType, dst.colorSpace() must match.
        If SkImage SkAlphaType is kOpaque_SkAlphaType, dst.alphaType() must
        match. If SkImage SkColorSpace is nullptr, dst.colorSpace() must match. Returns
        false if pixel conversion is not possible.

        srcX and srcY may be negative to copy only top or left of source. Returns
        false if width() or height() is zero or negative.
        Returns false if abs(srcX) >= Image width(), or if abs(srcY) >= Image height().

        If cachingHint is kAllow_CachingHint, pixels may be retained locally.
        If cachingHint is kDisallow_CachingHint, pixels are not added to the local cache.

        @param context      the GrDirectContext in play, if it exists
        @param dst          destination SkPixmap: SkImageInfo, pixels, row bytes
        @param srcX         column index whose absolute value is less than width()
        @param srcY         row index whose absolute value is less than height()
        @param cachingHint  whether the pixels should be cached locallyZ
        @return             true if pixels are copied to dst
    */
    bool readPixels(GrDirectContext* context,
                    const SkPixmap& dst,
                    int srcX,
                    int srcY,
                    CachingHint cachingHint = kAllow_CachingHint) const;

#ifndef SK_IMAGE_READ_PIXELS_DISABLE_LEGACY_API
    /** Deprecated. Use the variants that accept a GrDirectContext. */
    bool readPixels(const SkImageInfo& dstInfo, void* dstPixels, size_t dstRowBytes,
                    int srcX, int srcY, CachingHint cachingHint = kAllow_CachingHint) const;
    bool readPixels(const SkPixmap& dst, int srcX, int srcY,
                    CachingHint cachingHint = kAllow_CachingHint) const;
#endif

    /** The result from asyncRescaleAndReadPixels() or asyncRescaleAndReadPixelsYUV420(). */
    class AsyncReadResult {
    public:
        AsyncReadResult(const AsyncReadResult&) = delete;
        AsyncReadResult(AsyncReadResult&&) = delete;
        AsyncReadResult& operator=(const AsyncReadResult&) = delete;
        AsyncReadResult& operator=(AsyncReadResult&&) = delete;

        virtual ~AsyncReadResult() = default;
        virtual int count() const = 0;
        virtual const void* data(int i) const = 0;
        virtual size_t rowBytes(int i) const = 0;

    protected:
        AsyncReadResult() = default;
    };

    /** Client-provided context that is passed to client-provided ReadPixelsContext. */
    using ReadPixelsContext = void*;

    /**  Client-provided callback to asyncRescaleAndReadPixels() or
         asyncRescaleAndReadPixelsYUV420() that is called when read result is ready or on failure.
     */
    using ReadPixelsCallback = void(ReadPixelsContext, std::unique_ptr<const AsyncReadResult>);

    enum class RescaleGamma : bool { kSrc, kLinear };

    enum class RescaleMode {
        kNearest,
        kLinear,
        kRepeatedLinear,
        kRepeatedCubic,
    };

    /** Makes image pixel data available to caller, possibly asynchronously. It can also rescale
        the image pixels.

        Currently asynchronous reads are only supported on the GPU backend and only when the
        underlying 3D API supports transfer buffers and CPU/GPU synchronization primitives. In all
        other cases this operates synchronously.

        Data is read from the source sub-rectangle, is optionally converted to a linear gamma, is
        rescaled to the size indicated by 'info', is then converted to the color space, color type,
        and alpha type of 'info'. A 'srcRect' that is not contained by the bounds of the image
        causes failure.

        When the pixel data is ready the caller's ReadPixelsCallback is called with a
        AsyncReadResult containing pixel data in the requested color type, alpha type, and color
        space. The AsyncReadResult will have count() == 1. Upon failure the callback is called with
        nullptr for AsyncReadResult. For a GPU image this flushes work but a submit must occur to
        guarantee a finite time before the callback is called.

        The data is valid for the lifetime of AsyncReadResult with the exception that if the SkImage
        is GPU-backed the data is immediately invalidated if the context is abandoned or
        destroyed.

        @param info            info of the requested pixels
        @param srcRect         subrectangle of image to read
        @param rescaleGamma    controls whether rescaling is done in the image's gamma or whether
                               the source data is transformed to a linear gamma before rescaling.
        @param rescaleMode     controls the technique (and cost) of the rescaling
        @param callback        function to call with result of the read
        @param context         passed to callback
    */
    void asyncRescaleAndReadPixels(const SkImageInfo& info,
                                   const SkIRect& srcRect,
                                   RescaleGamma rescaleGamma,
                                   RescaleMode rescaleMode,
                                   ReadPixelsCallback callback,
                                   ReadPixelsContext context) const;

    /**
        Similar to asyncRescaleAndReadPixels but performs an additional conversion to YUV. The
        RGB->YUV conversion is controlled by 'yuvColorSpace'. The YUV data is returned as three
        planes ordered y, u, v. The u and v planes are half the width and height of the resized
        rectangle. The y, u, and v values are single bytes. Currently this fails if 'dstSize'
        width and height are not even. A 'srcRect' that is not contained by the bounds of the
        image causes failure.

        When the pixel data is ready the caller's ReadPixelsCallback is called with a
        AsyncReadResult containing the planar data. The AsyncReadResult will have count() == 3.
        Upon failure the callback is called with nullptr for AsyncReadResult. For a GPU image this
        flushes work but a submit must occur to guarantee a finite time before the callback is
        called.

        The data is valid for the lifetime of AsyncReadResult with the exception that if the SkImage
        is GPU-backed the data is immediately invalidated if the context is abandoned or
        destroyed.

        @param yuvColorSpace  The transformation from RGB to YUV. Applied to the resized image
                              after it is converted to dstColorSpace.
        @param dstColorSpace  The color space to convert the resized image to, after rescaling.
        @param srcRect        The portion of the image to rescale and convert to YUV planes.
        @param dstSize        The size to rescale srcRect to
        @param rescaleGamma   controls whether rescaling is done in the image's gamma or whether
                              the source data is transformed to a linear gamma before rescaling.
        @param rescaleMode    controls the technique (and cost) of the rescaling
        @param callback       function to call with the planar read result
        @param context        passed to callback
     */
    void asyncRescaleAndReadPixelsYUV420(SkYUVColorSpace yuvColorSpace,
                                         sk_sp<SkColorSpace> dstColorSpace,
                                         const SkIRect& srcRect,
                                         const SkISize& dstSize,
                                         RescaleGamma rescaleGamma,
                                         RescaleMode rescaleMode,
                                         ReadPixelsCallback callback,
                                         ReadPixelsContext context) const;

    /** Copies SkImage to dst, scaling pixels to fit dst.width() and dst.height(), and
        converting pixels to match dst.colorType() and dst.alphaType(). Returns true if
        pixels are copied. Returns false if dst.addr() is nullptr, or dst.rowBytes() is
        less than dst SkImageInfo::minRowBytes.

        Pixels are copied only if pixel conversion is possible. If SkImage SkColorType is
        kGray_8_SkColorType, or kAlpha_8_SkColorType; dst.colorType() must match.
        If SkImage SkColorType is kGray_8_SkColorType, dst.colorSpace() must match.
        If SkImage SkAlphaType is kOpaque_SkAlphaType, dst.alphaType() must
        match. If SkImage SkColorSpace is nullptr, dst.colorSpace() must match. Returns
        false if pixel conversion is not possible.

        If cachingHint is kAllow_CachingHint, pixels may be retained locally.
        If cachingHint is kDisallow_CachingHint, pixels are not added to the local cache.

        @param dst            destination SkPixmap: SkImageInfo, pixels, row bytes
        @return               true if pixels are scaled to fit dst
    */
    bool scalePixels(const SkPixmap& dst, const SkSamplingOptions&,
                     CachingHint cachingHint = kAllow_CachingHint) const;

    /** Returns encoded SkImage pixels as SkData, if SkImage was created from supported
        encoded stream format. Platform support for formats vary and may require building
        with one or more of: SK_ENCODE_JPEG, SK_ENCODE_PNG, SK_ENCODE_WEBP.

        Returns nullptr if SkImage contents are not encoded.

        @return  encoded SkImage, or nullptr

        example: https://fiddle.skia.org/c/@Image_refEncodedData
    */
    sk_sp<SkData> refEncodedData() const;

    /** Returns subset of this image.

        Returns nullptr if any of the following are true:
          - Subset is empty
          - Subset is not contained inside the image's bounds
          - Pixels in the image could not be read or copied

        If this image is texture-backed, the context parameter is required and must match the
        context of the source image. If the context parameter is provided, and the image is
        raster-backed, the subset will be converted to texture-backed.

        @param subset  bounds of returned SkImage
        @param context the GrDirectContext in play, if it exists
        @return        the subsetted image, or nullptr

        example: https://fiddle.skia.org/c/@Image_makeSubset
    */
    sk_sp<SkImage> makeSubset(const SkIRect& subset, GrDirectContext* direct = nullptr) const;

    /**
     *  Returns true if the image has mipmap levels.
     */
    bool hasMipmaps() const;

    /**
     *  Returns an image with the same "base" pixels as the this image, but with mipmap levels
     *  automatically generated and attached.
     */
    sk_sp<SkImage> withDefaultMipmaps() const;

#if defined(SK_GANESH) || defined(SK_GRAPHITE)
    using ReleaseContext = SkImages::ReleaseContext;
    using TextureReleaseProc = void (*)(ReleaseContext);
#endif

#if defined(SK_GRAPHITE)
    // Passed to both fulfill and imageRelease
    using GraphitePromiseImageContext = void*;
    // Returned from fulfill and passed into textureRelease
    using GraphitePromiseTextureReleaseContext = void*;

    using GraphitePromiseImageFulfillProc =
            std::tuple<skgpu::graphite::BackendTexture, GraphitePromiseTextureReleaseContext>
            (*)(GraphitePromiseImageContext);
    using GraphitePromiseImageReleaseProc = void (*)(GraphitePromiseImageContext);
    using GraphitePromiseTextureReleaseProc = void (*)(GraphitePromiseTextureReleaseContext);

    /** Create a new SkImage that is very similar to an SkImage created by
        MakeGraphiteFromBackendTexture. The difference is that the caller need not have created the
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
        @param isVolatile     volatility of the promise image
        @param fulfill        function called to get the actual backend texture
        @param imageRelease   function called when any image-centric data can be deleted
        @param textureRelease function called when the backend texture can be deleted
        @param imageContext   state passed to fulfill and imageRelease
        @return               created SkImage, or nullptr
    */
    static sk_sp<SkImage> MakeGraphitePromiseTexture(skgpu::graphite::Recorder*,
                                                     SkISize dimensions,
                                                     const skgpu::graphite::TextureInfo&,
                                                     const SkColorInfo&,
                                                     skgpu::graphite::Volatile,
                                                     GraphitePromiseImageFulfillProc,
                                                     GraphitePromiseImageReleaseProc,
                                                     GraphitePromiseTextureReleaseProc,
                                                     GraphitePromiseImageContext);

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
        @return                    created SkImage, or nullptr
    */
    static sk_sp<SkImage> MakeGraphiteFromBackendTexture(skgpu::graphite::Recorder*,
                                                         const skgpu::graphite::BackendTexture&,
                                                         SkColorType colorType,
                                                         SkAlphaType alphaType,
                                                         sk_sp<SkColorSpace> colorSpace,
                                                         TextureReleaseProc = nullptr,
                                                         ReleaseContext = nullptr);

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
    static sk_sp<SkImage> MakeGraphiteFromYUVABackendTextures(
            skgpu::graphite::Recorder* recorder,
            const skgpu::graphite::YUVABackendTextures& yuvaBackendTextures,
            sk_sp<SkColorSpace> imageColorSpace,
            TextureReleaseProc = nullptr,
            ReleaseContext = nullptr);

    struct RequiredImageProperties {
        skgpu::Mipmapped fMipmapped;
    };

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
        @param RequiredImageProperties  Properties the returned SkImage must possess (e.g.,
                                        mipmaps)
        @param limitToMaxTextureSize    Downscale image to GPU maximum texture size, if necessary
        @param imgColorSpace            Range of colors of the resulting image; may be nullptr
        @return                         Created SkImage, or nullptr
    */
    static sk_sp<SkImage> MakeGraphiteFromYUVAPixmaps(skgpu::graphite::Recorder*,
                                                      const SkYUVAPixmaps& pixmaps,
                                                      RequiredImageProperties = {},
                                                      bool limitToMaxTextureSize = false,
                                                      sk_sp<SkColorSpace> imgColorSpace = nullptr);

    /** Graphite version of makeTextureImage.

        Returns an SkImage backed by a Graphite texture, using the provided Recorder for creation
        and uploads if necessary. The returned SkImage respects the required image properties'
        mipmap setting for non-Graphite SkImages; i.e., if mipmapping is required, the backing
        Graphite texture will have allocated mip map levels.

        It is assumed that MIP maps are always supported by the GPU.

        Returns original SkImage if the image is already Graphite-backed and the required mipmapping
        is compatible with the backing Graphite texture. If the required mipmapping is not
        compatible, nullptr will be returned.

        Returns nullptr if no Recorder is provided, or if SkImage was created with another
        Recorder and work on that Recorder has not been submitted.

        @param Recorder                 the Recorder to use for storing commands
        @param RequiredImageProperties  properties the returned SkImage must possess (e.g.,
                                        mipmaps)
        @return                         created SkImage, or nullptr
    */
    virtual sk_sp<SkImage> makeTextureImage(skgpu::graphite::Recorder*,
                                            RequiredImageProperties = {}) const = 0;

    /** Returns subset of this image.

        Returns nullptr if any of the following are true:
          - Subset is empty
          - Subset is not contained inside the image's bounds
          - Pixels in the image could not be read or copied

        If this image is texture-backed, the recorder parameter is required.
        If the recorder parameter is provided, and the image is raster-backed, the subset will
        be converted to texture-backed.

        @param subset                   bounds of returned SkImage
        @param recorder                 the recorder in which to create the new image
        @param RequiredImageProperties  properties the returned SkImage must possess (e.g.,
                                        mipmaps)
        @return                         the subsetted image, or nullptr
    */
    sk_sp<SkImage> makeSubset(const SkIRect& subset,
                              skgpu::graphite::Recorder*,
                              RequiredImageProperties = {}) const;

    /** Creates SkImage in target SkColorSpace.
        Returns nullptr if SkImage could not be created.

        Returns original SkImage if it is in target SkColorSpace.
        Otherwise, converts pixels from SkImage SkColorSpace to target SkColorSpace.
        If SkImage colorSpace() returns nullptr, SkImage SkColorSpace is assumed to be sRGB.

        If this image is graphite-backed, the recorder parameter is required.

        @param targetColorSpace         SkColorSpace describing color range of returned SkImage
        @param recorder                 The Recorder in which to create the new image
        @param RequiredImageProperties  properties the returned SkImage must possess (e.g.,
                                        mipmaps)
        @return                         created SkImage in target SkColorSpace
    */
    sk_sp<SkImage> makeColorSpace(sk_sp<SkColorSpace> targetColorSpace,
                                  skgpu::graphite::Recorder*,
                                  RequiredImageProperties = {}) const;

    /** Experimental.
        Creates SkImage in target SkColorType and SkColorSpace.
        Returns nullptr if SkImage could not be created.

        Returns original SkImage if it is in target SkColorType and SkColorSpace.

        If this image is graphite-backed, the recorder parameter is required.

        @param targetColorType          SkColorType of returned SkImage
        @param targetColorSpace         SkColorSpace of returned SkImage
        @param recorder                 The Recorder in which to create the new image
        @param RequiredImageProperties  properties the returned SkImage must possess (e.g.,
                                        mipmaps)
        @return                         created SkImage in target SkColorType and SkColorSpace
    */
    sk_sp<SkImage> makeColorTypeAndColorSpace(SkColorType targetColorType,
                                              sk_sp<SkColorSpace> targetColorSpace,
                                              skgpu::graphite::Recorder*,
                                              RequiredImageProperties = {}) const;

#endif // SK_GRAPHITE

    /** Returns raster image or lazy image. Copies SkImage backed by GPU texture into
        CPU memory if needed. Returns original SkImage if decoded in raster bitmap,
        or if encoded in a stream.

        Returns nullptr if backed by GPU texture and copy fails.

        @return  raster image, lazy image, or nullptr

        example: https://fiddle.skia.org/c/@Image_makeNonTextureImage
    */
    sk_sp<SkImage> makeNonTextureImage() const;

    /** Returns raster image. Copies SkImage backed by GPU texture into CPU memory,
        or decodes SkImage from lazy image. Returns original SkImage if decoded in
        raster bitmap.

        Returns nullptr if copy, decode, or pixel read fails.

        If cachingHint is kAllow_CachingHint, pixels may be retained locally.
        If cachingHint is kDisallow_CachingHint, pixels are not added to the local cache.

        @return  raster image, or nullptr

        example: https://fiddle.skia.org/c/@Image_makeRasterImage
    */
    sk_sp<SkImage> makeRasterImage(CachingHint cachingHint = kDisallow_CachingHint) const;

    /** Creates filtered SkImage. filter processes original SkImage, potentially changing
        color, position, and size. subset is the bounds of original SkImage processed
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
    sk_sp<SkImage> makeWithFilter(GrRecordingContext* context,
                                  const SkImageFilter* filter, const SkIRect& subset,
                                  const SkIRect& clipBounds, SkIRect* outSubset,
                                  SkIPoint* offset) const;

    /** Deprecated.
     */
    enum LegacyBitmapMode {
        kRO_LegacyBitmapMode, //!< returned bitmap is read-only and immutable
    };

    /** Deprecated.
        Creates raster SkBitmap with same pixels as SkImage. If legacyBitmapMode is
        kRO_LegacyBitmapMode, returned bitmap is read-only and immutable.
        Returns true if SkBitmap is stored in bitmap. Returns false and resets bitmap if
        SkBitmap write did not succeed.

        @param bitmap            storage for legacy SkBitmap
        @param legacyBitmapMode  bitmap is read-only and immutable
        @return                  true if SkBitmap was created
    */
    bool asLegacyBitmap(SkBitmap* bitmap,
                        LegacyBitmapMode legacyBitmapMode = kRO_LegacyBitmapMode) const;

    /** Returns true if SkImage is backed by an image-generator or other service that creates
        and caches its pixels or texture on-demand.

        @return  true if SkImage is created as needed

        example: https://fiddle.skia.org/c/@Image_isLazyGenerated_a
        example: https://fiddle.skia.org/c/@Image_isLazyGenerated_b
    */
    bool isLazyGenerated() const;

    /** Creates SkImage in target SkColorSpace.
        Returns nullptr if SkImage could not be created.

        Returns original SkImage if it is in target SkColorSpace.
        Otherwise, converts pixels from SkImage SkColorSpace to target SkColorSpace.
        If SkImage colorSpace() returns nullptr, SkImage SkColorSpace is assumed to be sRGB.

        If this image is texture-backed, the context parameter is required and must match the
        context of the source image.

        @param target  SkColorSpace describing color range of returned SkImage
        @param direct  The GrDirectContext in play, if it exists
        @return        created SkImage in target SkColorSpace

        example: https://fiddle.skia.org/c/@Image_makeColorSpace
    */
    sk_sp<SkImage> makeColorSpace(sk_sp<SkColorSpace> target,
                                  GrDirectContext* direct = nullptr) const;

    /** Experimental.
        Creates SkImage in target SkColorType and SkColorSpace.
        Returns nullptr if SkImage could not be created.

        Returns original SkImage if it is in target SkColorType and SkColorSpace.

        If this image is texture-backed, the context parameter is required and must match the
        context of the source image.

        @param targetColorType  SkColorType of returned SkImage
        @param targetColorSpace SkColorSpace of returned SkImage
        @param direct           The GrDirectContext in play, if it exists
        @return                 created SkImage in target SkColorType and SkColorSpace
    */
    sk_sp<SkImage> makeColorTypeAndColorSpace(SkColorType targetColorType,
                                              sk_sp<SkColorSpace> targetColorSpace,
                                              GrDirectContext* direct = nullptr) const;

    /** Creates a new SkImage identical to this one, but with a different SkColorSpace.
        This does not convert the underlying pixel data, so the resulting image will draw
        differently.
    */
    sk_sp<SkImage> reinterpretColorSpace(sk_sp<SkColorSpace> newColorSpace) const;

private:
    SkImage(const SkImageInfo& info, uint32_t uniqueID);

    friend class SkBitmap;
    friend class SkImage_Base;   // for private ctor
    friend class SkImage_Raster; // for withMipmaps
    friend class SkMipmapBuilder;

    SkImageInfo     fInfo;
    const uint32_t  fUniqueID;

    sk_sp<SkImage> withMipmaps(sk_sp<SkMipmap>) const;

    using INHERITED = SkRefCnt;
};

#endif
