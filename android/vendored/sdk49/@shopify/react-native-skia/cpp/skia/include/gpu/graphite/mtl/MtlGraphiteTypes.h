/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_MtlGraphiteTypes_DEFINED
#define skgpu_graphite_MtlGraphiteTypes_DEFINED

#include "include/gpu/graphite/GraphiteTypes.h"
#include "include/ports/SkCFObject.h"

///////////////////////////////////////////////////////////////////////////////

#ifdef __APPLE__

#include <CoreFoundation/CoreFoundation.h>
#include <TargetConditionals.h>

#if TARGET_OS_SIMULATOR
#define SK_API_AVAILABLE_CA_METAL_LAYER SK_API_AVAILABLE(macos(10.11), ios(13.0))
#else  // TARGET_OS_SIMULATOR
#define SK_API_AVAILABLE_CA_METAL_LAYER SK_API_AVAILABLE(macos(10.11), ios(8.0))
#endif  // TARGET_OS_SIMULATOR

#endif // __APPLE__


namespace skgpu::graphite {

/**
 * Declares typedefs for Metal types used in Graphite cpp code
 */
using MtlPixelFormat = unsigned int;
using MtlTextureUsage = unsigned int;
using MtlStorageMode = unsigned int;
using MtlHandle = const void*;

struct MtlTextureInfo {
    uint32_t fSampleCount = 1;
    skgpu::Mipmapped fMipmapped = skgpu::Mipmapped::kNo;

    // Since we aren't in an Obj-C header we can't directly use Mtl types here. Each of these can
    // cast to their mapped Mtl types list below.
    MtlPixelFormat fFormat = 0;       // MTLPixelFormat fFormat = MTLPixelFormatInvalid;
    MtlTextureUsage fUsage = 0;       // MTLTextureUsage fUsage = MTLTextureUsageUnknown;
    MtlStorageMode fStorageMode = 0;  // MTLStorageMode fStorageMode = MTLStorageModeShared;
    bool fFramebufferOnly = false;

    MtlTextureInfo() = default;
    MtlTextureInfo(MtlHandle mtlTexture);
    MtlTextureInfo(uint32_t sampleCount,
                   skgpu::Mipmapped mipmapped,
                   MtlPixelFormat format,
                   MtlTextureUsage usage,
                   MtlStorageMode storageMode,
                   bool framebufferOnly)
            : fSampleCount(sampleCount)
            , fMipmapped(mipmapped)
            , fFormat(format)
            , fUsage(usage)
            , fStorageMode(storageMode)
            , fFramebufferOnly(framebufferOnly) {}
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_MtlGraphiteTypes_DEFINED
