/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_DawnTypes_DEFINED
#define skgpu_graphite_DawnTypes_DEFINED

#include "include/gpu/graphite/GraphiteTypes.h"
#include "webgpu/webgpu_cpp.h"

namespace skgpu::graphite {

struct DawnTextureInfo {
    uint32_t fSampleCount = 1;
    Mipmapped fMipmapped = Mipmapped::kNo;

    // wgpu::TextureDescriptor properties
    wgpu::TextureFormat fFormat = wgpu::TextureFormat::Undefined;
    wgpu::TextureUsage  fUsage = wgpu::TextureUsage::None;

    DawnTextureInfo() = default;
    DawnTextureInfo(const wgpu::Texture& texture);
    DawnTextureInfo(uint32_t sampleCount,
                    Mipmapped mipmapped,
                    wgpu::TextureFormat format,
                    wgpu::TextureUsage usage)
            : fSampleCount(sampleCount)
            , fMipmapped(mipmapped)
            , fFormat(format)
            , fUsage(usage) {}
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_DawnTypes_DEFINED


