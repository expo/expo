/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_VulkanTypesPriv_DEFINED
#define skgpu_VulkanTypesPriv_DEFINED

#include "include/gpu/vk/VulkanTypes.h"

#include <atomic>

namespace skgpu {

class VulkanMutableTextureState {
public:
    VulkanMutableTextureState(VkImageLayout layout, uint32_t queueFamilyIndex)
            : fLayout(layout)
            , fQueueFamilyIndex(queueFamilyIndex) {}

    VulkanMutableTextureState& operator=(const VulkanMutableTextureState& that) {
        fLayout = that.getImageLayout();
        fQueueFamilyIndex = that.getQueueFamilyIndex();
        return *this;
    }

     void setImageLayout(VkImageLayout layout) {
        // Defaulting to use std::memory_order_seq_cst
        fLayout.store(layout);
    }

    VkImageLayout getImageLayout() const {
        // Defaulting to use std::memory_order_seq_cst
        return fLayout.load();
    }

    void setQueueFamilyIndex(uint32_t queueFamilyIndex) {
        // Defaulting to use std::memory_order_seq_cst
        fQueueFamilyIndex.store(queueFamilyIndex);
    }

    uint32_t getQueueFamilyIndex() const {
        // Defaulting to use std::memory_order_seq_cst
        return fQueueFamilyIndex.load();
    }

private:
    std::atomic<VkImageLayout> fLayout;
    std::atomic<uint32_t> fQueueFamilyIndex;
};

} // namespace skgpu

#endif // skgpu_VulkanGraphiteTypesPriv_DEFINED

