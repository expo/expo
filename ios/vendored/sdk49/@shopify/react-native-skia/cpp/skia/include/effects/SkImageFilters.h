/*
 * Copyright 2019 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkImageFilters_DEFINED
#define SkImageFilters_DEFINED

#include "include/core/SkColor.h"
#include "include/core/SkImage.h"
#include "include/core/SkImageFilter.h"
#include "include/core/SkPicture.h"
#include "include/core/SkRect.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkScalar.h"
#include "include/core/SkShader.h"
#include "include/core/SkTileMode.h"
#include "include/core/SkTypes.h"

#include <cstddef>
#include <optional>
#include <string_view>
#include <utility>

class SkBlender;
class SkColorFilter;
class SkMatrix;
class SkRuntimeShaderBuilder;
enum class SkBlendMode;
struct SkIPoint;
struct SkISize;
struct SkPoint3;
struct SkSamplingOptions;

// A set of factory functions providing useful SkImageFilter effects. For image filters that take an
// input filter, providing nullptr means it will automatically use the dynamic source image. This
// source depends on how the filter is applied, but is either the contents of a saved layer when
// drawing with SkCanvas, or an explicit SkImage if using one of the SkImages::MakeWithFilter
// factories.
class SK_API SkImageFilters {
public:
    // This is just a convenience type to allow passing SkIRects, SkRects, and optional pointers
    // to those types as a crop rect for the image filter factories. It's not intended to be used
    // directly.
    struct CropRect : public std::optional<SkRect> {
        CropRect() {}
        // Intentionally not explicit so callers don't have to use this type but can use SkIRect or
        // SkRect as desired.
        CropRect(const SkIRect& crop) : std::optional<SkRect>(SkRect::Make(crop)) {}
        CropRect(const SkRect& crop) : std::optional<SkRect>(crop) {}
        CropRect(const std::optional<SkRect>& crop) : std::optional<SkRect>(crop) {}
        CropRect(const std::nullopt_t&) : std::optional<SkRect>() {}

        // Backwards compatibility for when the APIs used to explicitly accept "const SkRect*"
        CropRect(std::nullptr_t) {}
        CropRect(const SkIRect* optionalCrop) {
            if (optionalCrop) {
                *this = SkRect::Make(*optionalCrop);
            }
        }
        CropRect(const SkRect* optionalCrop) {
            if (optionalCrop) {
                *this = *optionalCrop;
            }
        }

        // std::optional doesn't define == when comparing to another optional...
        bool operator==(const CropRect& o) const {
            return this->has_value() == o.has_value() &&
                   (!this->has_value() || this->value() == *o);
        }
    };

    /**
     *  Create a filter that implements a custom blend mode. Each output pixel is the result of
     *  combining the corresponding background and foreground pixels using the 4 coefficients:
     *     k1 * foreground * background + k2 * foreground + k3 * background + k4
     *  @param k1, k2, k3, k4 The four coefficients used to combine the foreground and background.
     *  @param enforcePMColor If true, the RGB channels will be clamped to the calculated alpha.
     *  @param background     The background content, using the source bitmap when this is null.
     *  @param foreground     The foreground content, using the source bitmap when this is null.
     *  @param cropRect       Optional rectangle that crops the inputs and output.
     */
    static sk_sp<SkImageFilter> Arithmetic(SkScalar k1, SkScalar k2, SkScalar k3, SkScalar k4,
                                           bool enforcePMColor, sk_sp<SkImageFilter> background,
                                           sk_sp<SkImageFilter> foreground,
                                           const CropRect& cropRect = {});

    /**
     *  This filter takes an SkBlendMode and uses it to composite the two filters together.
     *  @param mode       The blend mode that defines the compositing operation
     *  @param background The Dst pixels used in blending, if null the source bitmap is used.
     *  @param foreground The Src pixels used in blending, if null the source bitmap is used.
     *  @cropRect         Optional rectangle to crop input and output.
     */
    static sk_sp<SkImageFilter> Blend(SkBlendMode mode, sk_sp<SkImageFilter> background,
                                      sk_sp<SkImageFilter> foreground = nullptr,
                                      const CropRect& cropRect = {});

    /**
     *  This filter takes an SkBlendMode and uses it to composite the two filters together.
     *  @param blender       The blender that defines the compositing operation
     *  @param background The Dst pixels used in blending, if null the source bitmap is used.
     *  @param foreground The Src pixels used in blending, if null the source bitmap is used.
     *  @cropRect         Optional rectangle to crop input and output.
     */
    static sk_sp<SkImageFilter> Blend(sk_sp<SkBlender> blender, sk_sp<SkImageFilter> background,
                                      sk_sp<SkImageFilter> foreground = nullptr,
                                      const CropRect& cropRect = {});

    /**
     *  Create a filter that blurs its input by the separate X and Y sigmas. The provided tile mode
     *  is used when the blur kernel goes outside the input image.
     *  @param sigmaX   The Gaussian sigma value for blurring along the X axis.
     *  @param sigmaY   The Gaussian sigma value for blurring along the Y axis.
     *  @param tileMode The tile mode applied at edges .
     *                  TODO (michaelludwig) - kMirror is not supported yet
     *  @param input    The input filter that is blurred, uses source bitmap if this is null.
     *  @param cropRect Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> Blur(SkScalar sigmaX, SkScalar sigmaY, SkTileMode tileMode,
                                     sk_sp<SkImageFilter> input, const CropRect& cropRect = {});
    // As above, but defaults to the decal tile mode.
    static sk_sp<SkImageFilter> Blur(SkScalar sigmaX, SkScalar sigmaY, sk_sp<SkImageFilter> input,
                                     const CropRect& cropRect = {}) {
        return Blur(sigmaX, sigmaY, SkTileMode::kDecal, std::move(input), cropRect);
    }

    /**
     *  Create a filter that applies the color filter to the input filter results.
     *  @param cf       The color filter that transforms the input image.
     *  @param input    The input filter, or uses the source bitmap if this is null.
     *  @param cropRect Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> ColorFilter(sk_sp<SkColorFilter> cf, sk_sp<SkImageFilter> input,
                                            const CropRect& cropRect = {});

    /**
     *  Create a filter that composes 'inner' with 'outer', such that the results of 'inner' are
     *  treated as the source bitmap passed to 'outer', i.e. result = outer(inner(source)).
     *  @param outer The outer filter that evaluates the results of inner.
     *  @param inner The inner filter that produces the input to outer.
     */
    static sk_sp<SkImageFilter> Compose(sk_sp<SkImageFilter> outer, sk_sp<SkImageFilter> inner);

    /**
     *  Create a filter that applies a crop to the result of the 'input' filter. Pixels within the
     *  crop rectangle are unmodified from what 'input' produced. Pixels outside of crop match the
     *  provided SkTileMode (defaulting to kDecal).
     *
     *  NOTE: The optional CropRect argument for many of the factories is equivalent to creating the
     *  filter without a CropRect and then wrapping it in ::Crop(rect, kDecal). Explicitly adding
     *  Crop filters lets you control their tiling and use different geometry for the input and the
     *  output of another filter.
     *
     *  @param rect     The cropping geometry
     *  @param tileMode The tilemode applied to pixels *outside* of 'crop'
     *  @param input    The input filter that is cropped, uses source image if this is null
    */
    static sk_sp<SkImageFilter> Crop(const SkRect& rect,
                                     SkTileMode tileMode,
                                     sk_sp<SkImageFilter> input);
    static sk_sp<SkImageFilter> Crop(const SkRect& rect, sk_sp<SkImageFilter> input) {
        return Crop(rect, SkTileMode::kDecal, std::move(input));
    }

    /**
     *  Create a filter that moves each pixel in its color input based on an (x,y) vector encoded
     *  in its displacement input filter. Two color components of the displacement image are
     *  mapped into a vector as scale * (color[xChannel], color[yChannel]), where the channel
     *  selectors are one of R, G, B, or A.
     *  @param xChannelSelector RGBA channel that encodes the x displacement per pixel.
     *  @param yChannelSelector RGBA channel that encodes the y displacement per pixel.
     *  @param scale            Scale applied to displacement extracted from image.
     *  @param displacement     The filter defining the displacement image, or null to use source.
     *  @param color            The filter providing the color pixels to be displaced. If null,
     *                          it will use the source.
     *  @param cropRect         Optional rectangle that crops the color input and output.
     */
    static sk_sp<SkImageFilter> DisplacementMap(SkColorChannel xChannelSelector,
                                                SkColorChannel yChannelSelector,
                                                SkScalar scale, sk_sp<SkImageFilter> displacement,
                                                sk_sp<SkImageFilter> color,
                                                const CropRect& cropRect = {});

    /**
     *  Create a filter that draws a drop shadow under the input content. This filter produces an
     *  image that includes the inputs' content.
     *  @param dx       The X offset of the shadow.
     *  @param dy       The Y offset of the shadow.
     *  @param sigmaX   The blur radius for the shadow, along the X axis.
     *  @param sigmaY   The blur radius for the shadow, along the Y axis.
     *  @param color    The color of the drop shadow.
     *  @param input    The input filter, or will use the source bitmap if this is null.
     *  @param cropRect Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> DropShadow(SkScalar dx, SkScalar dy,
                                           SkScalar sigmaX, SkScalar sigmaY,
                                           SkColor color, sk_sp<SkImageFilter> input,
                                           const CropRect& cropRect = {});
    /**
     *  Create a filter that renders a drop shadow, in exactly the same manner as ::DropShadow,
     *  except that the resulting image does not include the input content. This allows the shadow
     *  and input to be composed by a filter DAG in a more flexible manner.
     *  @param dx       The X offset of the shadow.
     *  @param dy       The Y offset of the shadow.
     *  @param sigmaX   The blur radius for the shadow, along the X axis.
     *  @param sigmaY   The blur radius for the shadow, along the Y axis.
     *  @param color    The color of the drop shadow.
     *  @param input    The input filter, or will use the source bitmap if this is null.
     *  @param cropRect Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> DropShadowOnly(SkScalar dx, SkScalar dy,
                                               SkScalar sigmaX, SkScalar sigmaY,
                                               SkColor color, sk_sp<SkImageFilter> input,
                                               const CropRect& cropRect = {});

    /**
     * Create a filter that always produces transparent black.
     */
    static sk_sp<SkImageFilter> Empty();

    /**
     *  Create a filter that draws the 'srcRect' portion of image into 'dstRect' using the given
     *  filter quality. Similar to SkCanvas::drawImageRect. The returned image filter evaluates
     *  to transparent black if 'image' is null.
     *
     *  @param image    The image that is output by the filter, subset by 'srcRect'.
     *  @param srcRect  The source pixels sampled into 'dstRect'
     *  @param dstRect  The local rectangle to draw the image into.
     *  @param sampling The sampling to use when drawing the image.
     */
    static sk_sp<SkImageFilter> Image(sk_sp<SkImage> image, const SkRect& srcRect,
                                      const SkRect& dstRect, const SkSamplingOptions& sampling);

    /**
     *  Create a filter that draws the image using the given sampling.
     *  Similar to SkCanvas::drawImage. The returned image filter evaluates to transparent black if
     *  'image' is null.
     *
     *  @param image    The image that is output by the filter.
     *  @param sampling The sampling to use when drawing the image.
     */
    static sk_sp<SkImageFilter> Image(sk_sp<SkImage> image, const SkSamplingOptions& sampling) {
        if (image) {
            SkRect r = SkRect::Make(image->bounds());
            return Image(std::move(image), r, r, sampling);
        } else {
            return nullptr;
        }
    }

    /**
     *  Create a filter that fills 'lensBounds' with a magnification of the input.
     *
     *  @param lensBounds The outer bounds of the magnifier effect
     *  @param zoomAmount The amount of magnification applied to the input image
     *  @param inset      The size or width of the fish-eye distortion around the magnified content
     *  @param sampling   The SkSamplingOptions applied to the input image when magnified
     *  @param input      The input filter that is magnified; if null the source bitmap is used
     *  @param cropRect   Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> Magnifier(const SkRect& lensBounds,
                                          SkScalar zoomAmount,
                                          SkScalar inset,
                                          const SkSamplingOptions& sampling,
                                          sk_sp<SkImageFilter> input,
                                          const CropRect& cropRect = {});

    /**
     *  Create a filter that applies an NxM image processing kernel to the input image. This can be
     *  used to produce effects such as sharpening, blurring, edge detection, etc.
     *  @param kernelSize    The kernel size in pixels, in each dimension (N by M).
     *  @param kernel        The image processing kernel. Must contain N * M elements, in row order.
     *  @param gain          A scale factor applied to each pixel after convolution. This can be
     *                       used to normalize the kernel, if it does not already sum to 1.
     *  @param bias          A bias factor added to each pixel after convolution.
     *  @param kernelOffset  An offset applied to each pixel coordinate before convolution.
     *                       This can be used to center the kernel over the image
     *                       (e.g., a 3x3 kernel should have an offset of {1, 1}).
     *  @param tileMode      How accesses outside the image are treated.
     *                       TODO (michaelludwig) - kMirror is not supported yet
     *  @param convolveAlpha If true, all channels are convolved. If false, only the RGB channels
     *                       are convolved, and alpha is copied from the source image.
     *  @param input         The input image filter, if null the source bitmap is used instead.
     *  @param cropRect      Optional rectangle to which the output processing will be limited.
     */
    static sk_sp<SkImageFilter> MatrixConvolution(const SkISize& kernelSize,
                                                  const SkScalar kernel[], SkScalar gain,
                                                  SkScalar bias, const SkIPoint& kernelOffset,
                                                  SkTileMode tileMode, bool convolveAlpha,
                                                  sk_sp<SkImageFilter> input,
                                                  const CropRect& cropRect = {});

    /**
     *  Create a filter that transforms the input image by 'matrix'. This matrix transforms the
     *  local space, which means it effectively happens prior to any transformation coming from the
     *  SkCanvas initiating the filtering.
     *  @param matrix   The matrix to apply to the original content.
     *  @param sampling How the image will be sampled when it is transformed
     *  @param input    The image filter to transform, or null to use the source image.
     */
    static sk_sp<SkImageFilter> MatrixTransform(const SkMatrix& matrix,
                                                const SkSamplingOptions& sampling,
                                                sk_sp<SkImageFilter> input);

    /**
     *  Create a filter that merges the 'count' filters together by drawing their results in order
     *  with src-over blending.
     *  @param filters  The input filter array to merge, which must have 'count' elements. Any null
     *                  filter pointers will use the source bitmap instead.
     *  @param count    The number of input filters to be merged.
     *  @param cropRect Optional rectangle that crops all input filters and the output.
     */
    static sk_sp<SkImageFilter> Merge(sk_sp<SkImageFilter>* const filters, int count,
                                      const CropRect& cropRect = {});
    /**
     *  Create a filter that merges the results of the two filters together with src-over blending.
     *  @param first    The first input filter, or the source bitmap if this is null.
     *  @param second   The second input filter, or the source bitmap if this null.
     *  @param cropRect Optional rectangle that crops the inputs and output.
     */
    static sk_sp<SkImageFilter> Merge(sk_sp<SkImageFilter> first, sk_sp<SkImageFilter> second,
                                      const CropRect& cropRect = {}) {
        sk_sp<SkImageFilter> array[] = { std::move(first), std::move(second) };
        return Merge(array, 2, cropRect);
    }

    /**
     *  Create a filter that offsets the input filter by the given vector.
     *  @param dx       The x offset in local space that the image is shifted.
     *  @param dy       The y offset in local space that the image is shifted.
     *  @param input    The input that will be moved, if null the source bitmap is used instead.
     *  @param cropRect Optional rectangle to crop the input and output.
     */
    static sk_sp<SkImageFilter> Offset(SkScalar dx, SkScalar dy, sk_sp<SkImageFilter> input,
                                       const CropRect& cropRect = {});

    /**
     *  Create a filter that produces the SkPicture as its output, clipped to both 'targetRect' and
     *  the picture's internal cull rect.
     *
     *  If 'pic' is null, the returned image filter produces transparent black.
     *
     *  @param pic        The picture that is drawn for the filter output.
     *  @param targetRect The drawing region for the picture.
     */
    static sk_sp<SkImageFilter> Picture(sk_sp<SkPicture> pic, const SkRect& targetRect);
    // As above, but uses SkPicture::cullRect for the drawing region.
    static sk_sp<SkImageFilter> Picture(sk_sp<SkPicture> pic) {
        SkRect target = pic ? pic->cullRect() : SkRect::MakeEmpty();
        return Picture(std::move(pic), target);
    }

    /**
     *  Create a filter that fills the output with the per-pixel evaluation of the SkShader produced
     *  by the SkRuntimeShaderBuilder. The shader is defined in the image filter's local coordinate
     *  system, so it will automatically be affected by SkCanvas' transform.
     *
     *  This variant assumes that the runtime shader samples 'childShaderName' with the same input
     *  coordinate passed to to shader.
     *
     *  This requires a GPU backend or SkSL to be compiled in.
     *
     *  @param builder         The builder used to produce the runtime shader, that will in turn
     *                         fill the result image
     *  @param childShaderName The name of the child shader defined in the builder that will be
     *                         bound to the input param (or the source image if the input param
     *                         is null).  If empty, the builder can have exactly one child shader,
     *                         which automatically binds the input param.
     *  @param input           The image filter that will be provided as input to the runtime
     *                         shader. If null the implicit source image is used instead
     */
    static sk_sp<SkImageFilter> RuntimeShader(const SkRuntimeShaderBuilder& builder,
                                              std::string_view childShaderName,
                                              sk_sp<SkImageFilter> input) {
        return RuntimeShader(builder, /*sampleRadius=*/0.f, childShaderName, std::move(input));
    }

    /**
     * As above, but 'sampleRadius' defines the sampling radius of 'childShaderName' relative to
     * the runtime shader produced by 'builder'. If greater than 0, the coordinate passed to
     * childShader.eval() will be up to 'sampleRadius' away (maximum absolute offset in 'x' or 'y')
     * from the coordinate passed into the runtime shader.
     *
     * This allows Skia to provide sampleable values for the image filter without worrying about
     * boundary conditions.
     *
     * This requires a GPU backend or SkSL to be compiled in.
    */
    static sk_sp<SkImageFilter> RuntimeShader(const SkRuntimeShaderBuilder& builder,
                                              SkScalar sampleRadius,
                                              std::string_view childShaderName,
                                              sk_sp<SkImageFilter> input);

    /**
     *  Create a filter that fills the output with the per-pixel evaluation of the SkShader produced
     *  by the SkRuntimeShaderBuilder. The shader is defined in the image filter's local coordinate
     *  system, so it will automatically be affected by SkCanvas' transform.
     *
     *  This requires a GPU backend or SkSL to be compiled in.
     *
     *  @param builder          The builder used to produce the runtime shader, that will in turn
     *                          fill the result image
     *  @param childShaderNames The names of the child shaders defined in the builder that will be
     *                          bound to the input params (or the source image if the input param
     *                          is null). If any name is null, or appears more than once, factory
     *                          fails and returns nullptr.
     *  @param inputs           The image filters that will be provided as input to the runtime
     *                          shader. If any are null, the implicit source image is used instead.
     *  @param inputCount       How many entries are present in 'childShaderNames' and 'inputs'.
     */
    static sk_sp<SkImageFilter> RuntimeShader(const SkRuntimeShaderBuilder& builder,
                                              std::string_view childShaderNames[],
                                              const sk_sp<SkImageFilter> inputs[],
                                              int inputCount) {
        return RuntimeShader(builder, /*maxSampleRadius=*/0.f, childShaderNames,
                             inputs, inputCount);
    }

    /**
     * As above, but 'maxSampleRadius' defines the sampling limit on coordinates provided to all
     * child shaders. Like the single-child variant with a sample radius, this can be used to
     * inform Skia that the runtime shader guarantees that all dynamic children (defined in
     * childShaderNames) will be evaluated with coordinates at most 'maxSampleRadius' away from the
     * coordinate provided to the runtime shader itself.
     *
     *  This requires a GPU backend or SkSL to be compiled in.
     */
    static sk_sp<SkImageFilter> RuntimeShader(const SkRuntimeShaderBuilder& builder,
                                              SkScalar maxSampleRadius,
                                              std::string_view childShaderNames[],
                                              const sk_sp<SkImageFilter> inputs[],
                                              int inputCount);

    enum class Dither : bool {
        kNo = false,
        kYes = true
    };

    /**
     *  Create a filter that fills the output with the per-pixel evaluation of the SkShader. The
     *  shader is defined in the image filter's local coordinate system, so will automatically
     *  be affected by SkCanvas' transform.
     *
     *  Like Image() and Picture(), this is a leaf filter that can be used to introduce inputs to
     *  a complex filter graph, but should generally be combined with a filter that as at least
     *  one null input to use the implicit source image.
     *
     *  Returns an image filter that evaluates to transparent black if 'shader' is null.
     *
     *  @param shader The shader that fills the result image
     */
    static sk_sp<SkImageFilter> Shader(sk_sp<SkShader> shader, const CropRect& cropRect = {}) {
        return Shader(std::move(shader), Dither::kNo, cropRect);
    }
    static sk_sp<SkImageFilter> Shader(sk_sp<SkShader> shader, Dither dither,
                                       const CropRect& cropRect = {});

    /**
     *  Create a tile image filter.
     *  @param src   Defines the pixels to tile
     *  @param dst   Defines the pixel region that the tiles will be drawn to
     *  @param input The input that will be tiled, if null the source bitmap is used instead.
     */
    static sk_sp<SkImageFilter> Tile(const SkRect& src, const SkRect& dst,
                                     sk_sp<SkImageFilter> input);

    // Morphology filter effects

    /**
     *  Create a filter that dilates each input pixel's channel values to the max value within the
     *  given radii along the x and y axes.
     *  @param radiusX  The distance to dilate along the x axis to either side of each pixel.
     *  @param radiusY  The distance to dilate along the y axis to either side of each pixel.
     *  @param input    The image filter that is dilated, using source bitmap if this is null.
     *  @param cropRect Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> Dilate(SkScalar radiusX, SkScalar radiusY,
                                       sk_sp<SkImageFilter> input,
                                       const CropRect& cropRect = {});

    /**
     *  Create a filter that erodes each input pixel's channel values to the minimum channel value
     *  within the given radii along the x and y axes.
     *  @param radiusX  The distance to erode along the x axis to either side of each pixel.
     *  @param radiusY  The distance to erode along the y axis to either side of each pixel.
     *  @param input    The image filter that is eroded, using source bitmap if this is null.
     *  @param cropRect Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> Erode(SkScalar radiusX, SkScalar radiusY,
                                      sk_sp<SkImageFilter> input,
                                      const CropRect& cropRect = {});

    // Lighting filter effects

    /**
     *  Create a filter that calculates the diffuse illumination from a distant light source,
     *  interpreting the alpha channel of the input as the height profile of the surface (to
     *  approximate normal vectors).
     *  @param direction    The direction to the distance light.
     *  @param lightColor   The color of the diffuse light source.
     *  @param surfaceScale Scale factor to transform from alpha values to physical height.
     *  @param kd           Diffuse reflectance coefficient.
     *  @param input        The input filter that defines surface normals (as alpha), or uses the
     *                      source bitmap when null.
     *  @param cropRect     Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> DistantLitDiffuse(const SkPoint3& direction, SkColor lightColor,
                                                  SkScalar surfaceScale, SkScalar kd,
                                                  sk_sp<SkImageFilter> input,
                                                  const CropRect& cropRect = {});
    /**
     *  Create a filter that calculates the diffuse illumination from a point light source, using
     *  alpha channel of the input as the height profile of the surface (to approximate normal
     *  vectors).
     *  @param location     The location of the point light.
     *  @param lightColor   The color of the diffuse light source.
     *  @param surfaceScale Scale factor to transform from alpha values to physical height.
     *  @param kd           Diffuse reflectance coefficient.
     *  @param input        The input filter that defines surface normals (as alpha), or uses the
     *                      source bitmap when null.
     *  @param cropRect     Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> PointLitDiffuse(const SkPoint3& location, SkColor lightColor,
                                                SkScalar surfaceScale, SkScalar kd,
                                                sk_sp<SkImageFilter> input,
                                                const CropRect& cropRect = {});
    /**
     *  Create a filter that calculates the diffuse illumination from a spot light source, using
     *  alpha channel of the input as the height profile of the surface (to approximate normal
     *  vectors). The spot light is restricted to be within 'cutoffAngle' of the vector between
     *  the location and target.
     *  @param location        The location of the spot light.
     *  @param target          The location that the spot light is point towards
     *  @param falloffExponent Exponential falloff parameter for illumination outside of cutoffAngle
     *  @param cutoffAngle     Maximum angle from lighting direction that receives full light
     *  @param lightColor      The color of the diffuse light source.
     *  @param surfaceScale    Scale factor to transform from alpha values to physical height.
     *  @param kd              Diffuse reflectance coefficient.
     *  @param input           The input filter that defines surface normals (as alpha), or uses the
     *                         source bitmap when null.
     *  @param cropRect        Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> SpotLitDiffuse(const SkPoint3& location, const SkPoint3& target,
                                               SkScalar falloffExponent, SkScalar cutoffAngle,
                                               SkColor lightColor, SkScalar surfaceScale,
                                               SkScalar kd, sk_sp<SkImageFilter> input,
                                               const CropRect& cropRect = {});

    /**
     *  Create a filter that calculates the specular illumination from a distant light source,
     *  interpreting the alpha channel of the input as the height profile of the surface (to
     *  approximate normal vectors).
     *  @param direction    The direction to the distance light.
     *  @param lightColor   The color of the specular light source.
     *  @param surfaceScale Scale factor to transform from alpha values to physical height.
     *  @param ks           Specular reflectance coefficient.
     *  @param shininess    The specular exponent determining how shiny the surface is.
     *  @param input        The input filter that defines surface normals (as alpha), or uses the
     *                      source bitmap when null.
     *  @param cropRect     Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> DistantLitSpecular(const SkPoint3& direction, SkColor lightColor,
                                                   SkScalar surfaceScale, SkScalar ks,
                                                   SkScalar shininess, sk_sp<SkImageFilter> input,
                                                   const CropRect& cropRect = {});
    /**
     *  Create a filter that calculates the specular illumination from a point light source, using
     *  alpha channel of the input as the height profile of the surface (to approximate normal
     *  vectors).
     *  @param location     The location of the point light.
     *  @param lightColor   The color of the specular light source.
     *  @param surfaceScale Scale factor to transform from alpha values to physical height.
     *  @param ks           Specular reflectance coefficient.
     *  @param shininess    The specular exponent determining how shiny the surface is.
     *  @param input        The input filter that defines surface normals (as alpha), or uses the
     *                      source bitmap when null.
     *  @param cropRect     Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> PointLitSpecular(const SkPoint3& location, SkColor lightColor,
                                                 SkScalar surfaceScale, SkScalar ks,
                                                 SkScalar shininess, sk_sp<SkImageFilter> input,
                                                 const CropRect& cropRect = {});
    /**
     *  Create a filter that calculates the specular illumination from a spot light source, using
     *  alpha channel of the input as the height profile of the surface (to approximate normal
     *  vectors). The spot light is restricted to be within 'cutoffAngle' of the vector between
     *  the location and target.
     *  @param location        The location of the spot light.
     *  @param target          The location that the spot light is point towards
     *  @param falloffExponent Exponential falloff parameter for illumination outside of cutoffAngle
     *  @param cutoffAngle     Maximum angle from lighting direction that receives full light
     *  @param lightColor      The color of the specular light source.
     *  @param surfaceScale    Scale factor to transform from alpha values to physical height.
     *  @param ks              Specular reflectance coefficient.
     *  @param shininess       The specular exponent determining how shiny the surface is.
     *  @param input           The input filter that defines surface normals (as alpha), or uses the
     *                         source bitmap when null.
     *  @param cropRect        Optional rectangle that crops the input and output.
     */
    static sk_sp<SkImageFilter> SpotLitSpecular(const SkPoint3& location, const SkPoint3& target,
                                                SkScalar falloffExponent, SkScalar cutoffAngle,
                                                SkColor lightColor, SkScalar surfaceScale,
                                                SkScalar ks, SkScalar shininess,
                                                sk_sp<SkImageFilter> input,
                                                const CropRect& cropRect = {});

private:
    SkImageFilters() = delete;
};

#endif // SkImageFilters_DEFINED
