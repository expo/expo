/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_MutableTextureState_DEFINED
#define skgpu_MutableTextureState_DEFINED

#include "include/gpu/GpuTypes.h"

#ifdef SK_VULKAN
#include "include/private/gpu/vk/VulkanTypesPriv.h"
#endif

#include <new>

class GrVkGpu;

namespace skgpu {

/**
 * Since Skia and clients can both modify gpu textures and their connected state, Skia needs a way
 * for clients to inform us if they have modifiend any of this state. In order to not need setters
 * for every single API and state, we use this class to be a generic wrapper around all the mutable
 * state. This class is used for calls that inform Skia of these texture/image state changes by the
 * client as well as for requesting state changes to be done by Skia. The backend specific state
 * that is wrapped by this class are:
 *
 * Vulkan: VkImageLayout and QueueFamilyIndex
 */
class SK_API MutableTextureState {
public:
    MutableTextureState() {}

#ifdef SK_VULKAN
    MutableTextureState(VkImageLayout layout, uint32_t queueFamilyIndex)
            : fVkState(layout, queueFamilyIndex)
            , fBackend(BackendApi::kVulkan)
            , fIsValid(true) {}
#endif

    MutableTextureState(const MutableTextureState& that)
            : fBackend(that.fBackend), fIsValid(that.fIsValid) {
        if (!fIsValid) {
            return;
        }
        switch (fBackend) {
            case BackendApi::kVulkan:
    #ifdef SK_VULKAN
                SkASSERT(that.fBackend == BackendApi::kVulkan);
                fVkState = that.fVkState;
    #endif
                break;
            default:
                (void)that;
                SkUNREACHABLE;
        }
    }

    MutableTextureState& operator=(const MutableTextureState& that) {
        if (this != &that) {
            this->~MutableTextureState();
            new (this) MutableTextureState(that);
        }
        return *this;
    }

#ifdef SK_VULKAN
    // If this class is not Vulkan backed it will return value of VK_IMAGE_LAYOUT_UNDEFINED.
    // Otherwise it will return the VkImageLayout.
    VkImageLayout getVkImageLayout() const {
        if (this->isValid() && fBackend != BackendApi::kVulkan) {
            return VK_IMAGE_LAYOUT_UNDEFINED;
        }
        return fVkState.getImageLayout();
    }

    // If this class is not Vulkan backed it will return value of VK_QUEUE_FAMILY_IGNORED.
    // Otherwise it will return the VkImageLayout.
    uint32_t getQueueFamilyIndex() const {
        if (this->isValid() && fBackend != BackendApi::kVulkan) {
            return VK_QUEUE_FAMILY_IGNORED;
        }
        return fVkState.getQueueFamilyIndex();
    }
#endif

    BackendApi backend() const { return fBackend; }

    // Returns true if the backend mutable state has been initialized.
    bool isValid() const { return fIsValid; }

private:
    friend class MutableTextureStateRef;
    friend class ::GrVkGpu;

#ifdef SK_VULKAN
    void setVulkanState(VkImageLayout layout, uint32_t queueFamilyIndex) {
        SkASSERT(!this->isValid() || fBackend == BackendApi::kVulkan);
        fVkState.setImageLayout(layout);
        fVkState.setQueueFamilyIndex(queueFamilyIndex);
        fBackend = BackendApi::kVulkan;
        fIsValid = true;
    }
#endif

    union {
        char fPlaceholder;
#ifdef SK_VULKAN
        VulkanMutableTextureState fVkState;
#endif
    };

    BackendApi fBackend = BackendApi::kMock;
    bool fIsValid = false;
};

} // namespace skgpu

#endif // skgpu_MutableTextureState_DEFINED
