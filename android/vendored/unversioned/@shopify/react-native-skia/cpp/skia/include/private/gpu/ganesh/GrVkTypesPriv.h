/*
 * Copyright 2018 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrVkTypesPriv_DEFINED
#define GrVkTypesPriv_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/gpu/vk/GrVkTypes.h"

namespace skgpu {
class MutableTextureStateRef;
}


// This struct is to used to store the the actual information about the vulkan backend image on the
// GrBackendTexture and GrBackendRenderTarget. When a client calls getVkImageInfo on a
// GrBackendTexture/RenderTarget, we use the GrVkBackendSurfaceInfo to create a snapshot
// GrVkImgeInfo object. Internally, this uses a ref count GrVkImageLayout object to track the
// current VkImageLayout which can be shared with an internal GrVkImage so that layout updates can
// be seen by all users of the image.
struct GrVkBackendSurfaceInfo {
    GrVkBackendSurfaceInfo(GrVkImageInfo info) : fImageInfo(info) {}

    void cleanup();

    GrVkBackendSurfaceInfo& operator=(const GrVkBackendSurfaceInfo&) = delete;

    // Assigns the passed in GrVkBackendSurfaceInfo to this object. if isValid is true we will also
    // attempt to unref the old fLayout on this object.
    void assign(const GrVkBackendSurfaceInfo&, bool isValid);

    GrVkImageInfo snapImageInfo(const skgpu::MutableTextureStateRef*) const;

    bool isProtected() const { return fImageInfo.fProtected == GrProtected::kYes; }
#if GR_TEST_UTILS
    bool operator==(const GrVkBackendSurfaceInfo& that) const;
#endif

private:
    GrVkImageInfo    fImageInfo;
};

struct GrVkImageSpec {
    GrVkImageSpec()
            : fImageTiling(VK_IMAGE_TILING_OPTIMAL)
            , fFormat(VK_FORMAT_UNDEFINED)
            , fImageUsageFlags(0)
            , fSharingMode(VK_SHARING_MODE_EXCLUSIVE) {}

    GrVkImageSpec(const GrVkSurfaceInfo& info)
            : fImageTiling(info.fImageTiling)
            , fFormat(info.fFormat)
            , fImageUsageFlags(info.fImageUsageFlags)
            , fYcbcrConversionInfo(info.fYcbcrConversionInfo)
            , fSharingMode(info.fSharingMode) {}

    VkImageTiling fImageTiling;
    VkFormat fFormat;
    VkImageUsageFlags fImageUsageFlags;
    GrVkYcbcrConversionInfo fYcbcrConversionInfo;
    VkSharingMode fSharingMode;
};

GrVkSurfaceInfo GrVkImageSpecToSurfaceInfo(const GrVkImageSpec& vkSpec,
                                           uint32_t sampleCount,
                                           uint32_t levelCount,
                                           GrProtected isProtected);

#endif
