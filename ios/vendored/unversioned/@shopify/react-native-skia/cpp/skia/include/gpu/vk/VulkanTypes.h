/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_VulkanTypes_DEFINED
#define skgpu_VulkanTypes_DEFINED

#include "include/core/SkTypes.h"
#include "include/private/gpu/vk/SkiaVulkan.h"

#include <functional>

#ifndef VK_VERSION_1_1
#error Skia requires the use of Vulkan 1.1 headers
#endif

namespace skgpu {

using VulkanGetProc = std::function<PFN_vkVoidFunction(
        const char*, // function name
        VkInstance,  // instance or VK_NULL_HANDLE
        VkDevice     // device or VK_NULL_HANDLE
        )>;

typedef intptr_t VulkanBackendMemory;

/**
 * Types for interacting with Vulkan resources created externally to Skia.
 */
struct VulkanAlloc {
    // can be VK_NULL_HANDLE iff is an RT and is borrowed
    VkDeviceMemory      fMemory = VK_NULL_HANDLE;
    VkDeviceSize        fOffset = 0;
    VkDeviceSize        fSize = 0;  // this can be indeterminate iff Tex uses borrow semantics
    uint32_t            fFlags = 0;
    // handle to memory allocated via skgpu::VulkanMemoryAllocator.
    VulkanBackendMemory fBackendMemory = 0;

    enum Flag {
        kNoncoherent_Flag     = 0x1,   // memory must be flushed to device after mapping
        kMappable_Flag        = 0x2,   // memory is able to be mapped.
        kLazilyAllocated_Flag = 0x4,   // memory was created with lazy allocation
    };

    bool operator==(const VulkanAlloc& that) const {
        return fMemory == that.fMemory && fOffset == that.fOffset && fSize == that.fSize &&
               fFlags == that.fFlags && fUsesSystemHeap == that.fUsesSystemHeap;
    }

private:
    bool fUsesSystemHeap = false;
};

} // namespace skgpu

#endif // skgpu_VulkanTypes_DEFINED
