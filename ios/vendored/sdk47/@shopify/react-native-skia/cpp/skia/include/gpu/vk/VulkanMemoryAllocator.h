/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_VulkanMemoryAllocator_DEFINED
#define skgpu_VulkanMemoryAllocator_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/gpu/GpuTypes.h"
#include "include/gpu/vk/VulkanTypes.h"

namespace skgpu {

class VulkanMemoryAllocator : public SkRefCnt {
public:
    enum AllocationPropertyFlags {
        kNone_AllocationPropertyFlag                = 0b0000,
        // Allocation will be placed in its own VkDeviceMemory and not suballocated from some larger
        // block.
        kDedicatedAllocation_AllocationPropertyFlag = 0b0001,
        // Says that the backing memory can only be accessed by the device. Additionally the device
        // may lazily allocate the memory. This cannot be used with buffers that will be host
        // visible. Setting this flag does not guarantee that we will allocate memory that respects
        // it, but we will try to prefer memory that can respect it.
        kLazyAllocation_AllocationPropertyFlag      = 0b0010,
        // The allocation will be mapped immediately and stay mapped until it is destroyed. This
        // flag is only valid for buffers which are host visible (i.e. must have a usage other than
        // BufferUsage::kGpuOnly).
        kPersistentlyMapped_AllocationPropertyFlag  = 0b0100,
        // Allocation can only be accessed by the device using a protected context.
        kProtected_AllocationPropertyFlag           = 0b1000,
    };

    enum class BufferUsage {
        // Buffers that will only be accessed from the device (large const buffers). Will always be
        // in device local memory.
        kGpuOnly,
        // Buffers that typically will be updated multiple times by the host and read on the gpu
        // (e.g. uniform or vertex buffers). CPU writes will generally be sequential in the buffer
        // and will try to take advantage of the write-combined nature of the gpu buffers. Thus this
        // will always be mappable and coherent memory, and it will prefer to be in device local
        // memory.
        kCpuWritesGpuReads,
        // Buffers that will be accessed on the host and copied to another GPU resource (transfer
        // buffers). Will always be mappable and coherent memory.
        kTransfersFromCpuToGpu,
        // Buffers which are typically writted to by the GPU and then read on the host. Will always
        // be mappable memory, and will prefer cached memory.
        kTransfersFromGpuToCpu,
    };

    virtual VkResult allocateImageMemory(VkImage image,
                                         uint32_t allocationPropertyFlags,
                                         skgpu::VulkanBackendMemory* memory) = 0;

    virtual VkResult allocateBufferMemory(VkBuffer buffer,
                                          BufferUsage usage,
                                          uint32_t allocationPropertyFlags,
                                          skgpu::VulkanBackendMemory* memory) = 0;

    // Fills out the passed in skgpu::VulkanAlloc struct for the passed in
    // skgpu::VulkanBackendMemory.
    virtual void getAllocInfo(const skgpu::VulkanBackendMemory&, skgpu::VulkanAlloc*) const = 0;

    // Maps the entire allocation and returns a pointer to the start of the allocation. The
    // implementation may map more memory than just the allocation, but the returned pointer must
    // point at the start of the memory for the requested allocation.
    virtual void* mapMemory(const skgpu::VulkanBackendMemory&) { return nullptr; }
    virtual VkResult mapMemory(const skgpu::VulkanBackendMemory& memory, void** data) {
        *data = this->mapMemory(memory);
        // VK_ERROR_INITIALIZATION_FAILED is a bogus result to return from this function, but it is
        // just something to return that is not VK_SUCCESS and can't be interpreted by a caller to
        // mean something specific happened like device lost or oom. This will be removed once we
        // update clients to implement this virtual.
        return *data ? VK_SUCCESS : VK_ERROR_INITIALIZATION_FAILED;
    }
    virtual void unmapMemory(const skgpu::VulkanBackendMemory&) = 0;

    // The following two calls are used for managing non-coherent memory. The offset is relative to
    // the start of the allocation and not the underlying VkDeviceMemory. Additionaly the client
    // must make sure that the offset + size passed in is less that or equal to the allocation size.
    // It is the responsibility of the implementation to make sure all alignment requirements are
    // followed. The client should not have to deal with any sort of alignment issues.
    virtual void flushMappedMemory(const skgpu::VulkanBackendMemory&, VkDeviceSize, VkDeviceSize) {}
    virtual VkResult flushMemory(const skgpu::VulkanBackendMemory& memory,
                                 VkDeviceSize offset,
                                 VkDeviceSize size) {
        this->flushMappedMemory(memory, offset, size);
        return VK_SUCCESS;
    }
    virtual void invalidateMappedMemory(const skgpu::VulkanBackendMemory&,
                                        VkDeviceSize,
                                        VkDeviceSize) {}
    virtual VkResult invalidateMemory(const skgpu::VulkanBackendMemory& memory,
                                      VkDeviceSize offset,
                                      VkDeviceSize size) {
        this->invalidateMappedMemory(memory, offset, size);
        return VK_SUCCESS;
    }

    virtual void freeMemory(const skgpu::VulkanBackendMemory&) = 0;

    // Returns the total amount of memory that is allocated and in use by an allocation for this
    // allocator.
    virtual uint64_t totalUsedMemory() const = 0;

    // Returns the total amount of memory that is allocated by this allocator.
    virtual uint64_t totalAllocatedMemory() const = 0;
};

} // namespace skgpu

#endif // skgpu_VulkanMemoryAllocator_DEFINED
