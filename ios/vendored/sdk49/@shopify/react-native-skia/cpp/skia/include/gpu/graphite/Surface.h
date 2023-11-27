/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_Surface_DEFINED
#define skgpu_graphite_Surface_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkSurface.h"
#include "include/gpu/GpuTypes.h"

class SkImage;
struct SkImageInfo;

namespace skgpu::graphite {
class BackendTexture;
class Recorder;
}  // namespace skgpu::graphite

namespace SkSurfaces {
/**
 * The 'asImage' and 'makeImageCopy' API/entry points are currently only available for
 * Graphite.
 *
 * In this API, SkSurface no longer supports copy-on-write behavior. Instead, when creating
 * an image for a surface, the client must explicitly indicate if a copy should be made.
 * In both of the below calls the resource backing the surface will never change.
 *
 * The 'AsImage' entry point has some major ramifications for the mutability of the
 * returned SkImage. Since the originating surface and the returned image share the
 * same backing, care must be taken by the client to ensure that the contents of the image
 * reflect the desired contents when it is consumed by the gpu.
 * Note: if the backing GPU buffer isn't textureable this method will return null. Graphite
 * will not attempt to make a copy.
 * Note: For 'AsImage', the mipmapping of the image will match that of the source surface.
 *
 * The 'AsImageCopy' entry point allows subsetting and the addition of mipmaps (since
 * a copy is already being made).
 *
 * In Graphite, the legacy API call (i.e., makeImageSnapshot) will just always make a copy.
 */
SK_API sk_sp<SkImage> AsImage(sk_sp<const SkSurface>);
SK_API sk_sp<SkImage> AsImageCopy(sk_sp<const SkSurface>,
                                  const SkIRect* subset = nullptr,
                                  skgpu::Mipmapped = skgpu::Mipmapped::kNo);

/**
 * In Graphite, while clients hold a ref on an SkSurface, the backing gpu object does _not_
 * count against the budget. Once an SkSurface is freed, the backing gpu object may or may
 * not become a scratch (i.e., reusable) resource but, if it does, it will be counted against
 * the budget.
 */
SK_API sk_sp<SkSurface> RenderTarget(skgpu::graphite::Recorder*,
                                     const SkImageInfo& imageInfo,
                                     skgpu::Mipmapped = skgpu::Mipmapped::kNo,
                                     const SkSurfaceProps* surfaceProps = nullptr);

/**
 * Wraps a GPU-backed texture in an SkSurface. Depending on the backend gpu API, the caller may
 * be required to ensure the texture is valid for the lifetime of the returned SkSurface. The
 * required lifetimes for the specific apis are:
 *     Metal: Skia will call retain on the underlying MTLTexture so the caller can drop it once
 *            this call returns.
 *
 * SkSurface is returned if all the parameters are valid. The backendTexture is valid if its
 * format agrees with colorSpace and recorder; for instance, if backendTexture has an sRGB
 * configuration, then the recorder must support sRGB, and colorSpace must be present. Further,
 * backendTexture's width and height must not exceed the recorder's capabilities, and the
 * recorder must be able to support the back-end texture.
 */
SK_API sk_sp<SkSurface> WrapBackendTexture(skgpu::graphite::Recorder*,
                                           const skgpu::graphite::BackendTexture&,
                                           SkColorType colorType,
                                           sk_sp<SkColorSpace> colorSpace,
                                           const SkSurfaceProps* props);
}  // namespace SkSurfaces

#endif  // skgpu_graphite_Surface_DEFINED
