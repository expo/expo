/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_DawnTypesPriv_DEFINED
#define skgpu_graphite_DawnTypesPriv_DEFINED

#include "include/gpu/graphite/dawn/DawnTypes.h"

namespace skgpu::graphite {

struct DawnTextureSpec {
    DawnTextureSpec()
            : fFormat(wgpu::TextureFormat::Undefined)
            , fUsage(wgpu::TextureUsage::None) {}
    DawnTextureSpec(const DawnTextureInfo& info)
            : fFormat(info.fFormat)
            , fUsage(info.fUsage) {}

    bool operator==(const DawnTextureSpec& that) const {
        return fUsage == that.fUsage &&
               fFormat == that.fFormat;
    }

    wgpu::TextureFormat fFormat;
    wgpu::TextureUsage fUsage;
};

DawnTextureInfo DawnTextureSpecToTextureInfo(const DawnTextureSpec& dawnSpec,
                                             uint32_t sampleCount,
                                             Mipmapped mipmapped);

} // namespace skgpu::graphite

#endif // skgpu_graphite_DawnTypesPriv_DEFINED
