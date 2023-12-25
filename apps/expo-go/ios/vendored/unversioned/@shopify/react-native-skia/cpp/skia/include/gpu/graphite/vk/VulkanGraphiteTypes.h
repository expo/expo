/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_VulkanGraphiteTypes_DEFINED
#define skgpu_graphite_VulkanGraphiteTypes_DEFINED

#include "include/gpu/graphite/GraphiteTypes.h"
#include "include/gpu/vk/VulkanTypes.h"

namespace skgpu::graphite {

struct VulkanTextureInfo {
    uint32_t fSampleCount = 1;
    Mipmapped fMipmapped = Mipmapped::kNo;

    // VkImageCreateInfo properties
    // Currently the only supported flag is VK_IMAGE_CREATE_PROTECTED_BIT. Any other flag will not
    // be accepted
    VkImageCreateFlags       fFlags = 0;
    VkFormat                 fFormat = VK_FORMAT_UNDEFINED;
    VkImageTiling            fImageTiling = VK_IMAGE_TILING_OPTIMAL;
    VkImageUsageFlags        fImageUsageFlags = 0;
    VkSharingMode            fSharingMode = VK_SHARING_MODE_EXCLUSIVE;

    // Properties related to the image view and sampling. These are less inherent properties of the
    // VkImage but describe how the VkImage should be used within Skia.

    // What aspect to use for the VkImageView. The normal, default is VK_IMAGE_ASPECT_COLOR_BIT.
    // However, if the VkImage is a Ycbcr format, the client can pass a specific plan here to have
    // Skia directly sample a plane. In that case the client should also pass in a VkFormat that is
    // compatible with the plane as described by the Vulkan spec.
    VkImageAspectFlags fAspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
    // TODO: Either Make the ycbcr conversion info shareable with Ganesh or add a version for
    // Graphite.
    // GrVkYcbcrConversionInfo  fYcbcrConversionInfo;

    VulkanTextureInfo() = default;
    VulkanTextureInfo(uint32_t sampleCount,
                      Mipmapped mipmapped,
                      VkImageCreateFlags flags,
                      VkFormat format,
                      VkImageTiling imageTiling,
                      VkImageUsageFlags imageUsageFlags,
                      VkSharingMode sharingMode,
                      VkImageAspectFlags aspectMask)
            : fSampleCount(sampleCount)
            , fMipmapped(mipmapped)
            , fFlags(flags)
            , fFormat(format)
            , fImageTiling(imageTiling)
            , fImageUsageFlags(imageUsageFlags)
            , fSharingMode(sharingMode)
            , fAspectMask(aspectMask) {}
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_VulkanGraphiteTypes_DEFINED


