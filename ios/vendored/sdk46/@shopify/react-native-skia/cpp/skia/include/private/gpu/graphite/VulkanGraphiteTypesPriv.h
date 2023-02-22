/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_VulkanGraphiteTypesPriv_DEFINED
#define skgpu_graphite_VulkanGraphiteTypesPriv_DEFINED

#include "include/gpu/graphite/vk/VulkanGraphiteTypes.h"

namespace skgpu::graphite {

struct VulkanTextureSpec {
    VulkanTextureSpec()
            : fFlags(0)
            , fFormat(VK_FORMAT_UNDEFINED)
            , fImageTiling(VK_IMAGE_TILING_OPTIMAL)
            , fImageUsageFlags(0)
            , fSharingMode(VK_SHARING_MODE_EXCLUSIVE)
            , fCurrentQueueFamily(VK_QUEUE_FAMILY_IGNORED)
            , fImageLayout(VK_IMAGE_LAYOUT_UNDEFINED)
            , fAspectMask(VK_IMAGE_ASPECT_COLOR_BIT) {}
    VulkanTextureSpec(const VulkanTextureInfo& info)
            : fFlags(info.fFlags)
            , fFormat(info.fFormat)
            , fImageTiling(info.fImageTiling)
            , fImageUsageFlags(info.fImageUsageFlags)
            , fSharingMode(info.fSharingMode)
            , fCurrentQueueFamily(info.fCurrentQueueFamily)
            , fImageLayout(info.fImageLayout)
            , fAspectMask(info.fAspectMask) {}

    bool operator==(const VulkanTextureSpec& that) const {
        return fFlags == that.fFlags &&
               fFormat == that.fFormat &&
               fImageTiling == that.fImageTiling &&
               fImageUsageFlags == that.fImageUsageFlags &&
               fSharingMode == that.fSharingMode &&
               fCurrentQueueFamily == that.fCurrentQueueFamily &&
               fImageLayout == that.fImageLayout &&
               fAspectMask == that.fAspectMask;
    }

    VkImageCreateFlags       fFlags;
    VkFormat                 fFormat;
    VkImageTiling            fImageTiling;
    VkImageUsageFlags        fImageUsageFlags;
    VkSharingMode            fSharingMode;
    uint32_t                 fCurrentQueueFamily;
    VkImageLayout            fImageLayout;
    VkImageAspectFlags       fAspectMask;
    // GrVkYcbcrConversionInfo  fYcbcrConversionInfo;
};

VulkanTextureInfo VulkanTextureSpecToTextureInfo(const VulkanTextureSpec& vkSpec,
                                                 uint32_t sampleCount,
                                                 uint32_t levelCount);

} // namespace skgpu::graphite

#endif // skgpu_graphite_VulkanGraphiteTypesPriv_DEFINED
