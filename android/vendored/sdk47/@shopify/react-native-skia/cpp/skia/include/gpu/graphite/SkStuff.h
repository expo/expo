/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkStuff_DEFINED
#define SkStuff_DEFINED

#include "include/core/SkImageInfo.h"
#include "include/core/SkRefCnt.h"

class SkColorSpace;
class SkSurface;
class SkSurfaceProps;

namespace skgpu::graphite {
    class BackendTexture;
    class Recorder;
}

// TODO: Should be in SkSurface.h
sk_sp<SkSurface> MakeGraphite(skgpu::graphite::Recorder*, const SkImageInfo&);

/**
 * Wraps a GPU-backed texture into SkSurface. Depending on the backend gpu API, the caller may be
 * required to ensure the texture is valid for the lifetime of returned SkSurface. The required
 * lifetimes for the specific apis are:
 *     Metal: Skia will call retain on the underlying MTLTexture so the caller can drop it once this
 *            call returns.
 *
 * SkSurface is returned if all parameters are valid. BackendTexture is valid if its format agrees
 * with colorSpace and context; for instance, if backendTexture has an sRGB configuration, then
 * context must support sRGB, and colorSpace must be present. Further, backendTexture width and
 * height must not exceed context capabilities, and the context must be able to support back-end
 * textures.
 *
 * If SK_ENABLE_GRAPHITE is not defined, this has no effect and returns nullptr.
 */
sk_sp<SkSurface> MakeGraphiteFromBackendTexture(skgpu::graphite::Recorder*,
                                                const skgpu::graphite::BackendTexture&,
                                                SkColorType colorType,
                                                sk_sp<SkColorSpace> colorSpace,
                                                const SkSurfaceProps* props);

#endif // SkStuff_DEFINED
