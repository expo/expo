/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_TextureInfo_DEFINED
#define skgpu_graphite_TextureInfo_DEFINED

#include "include/gpu/graphite/GraphiteTypes.h"

#ifdef SK_METAL
#include "include/private/gpu/graphite/MtlTypesPriv.h"
#endif

#ifdef SK_VULKAN
#include "include/private/gpu/graphite/VulkanGraphiteTypesPriv.h"
#endif

namespace skgpu::graphite {

class TextureInfo {
public:
    TextureInfo() {}
#ifdef SK_METAL
    TextureInfo(const MtlTextureInfo& mtlInfo)
            : fBackend(BackendApi::kMetal)
            , fValid(true)
            , fSampleCount(mtlInfo.fSampleCount)
            , fLevelCount(mtlInfo.fLevelCount)
            , fProtected(Protected::kNo)
            , fMtlSpec(mtlInfo) {}
#endif

#ifdef SK_VULKAN
    TextureInfo(const VulkanTextureInfo& vkInfo)
            : fBackend(BackendApi::kVulkan)
            , fValid(true)
            , fSampleCount(vkInfo.fSampleCount)
            , fLevelCount(vkInfo.fLevelCount)
            , fProtected(Protected::kNo)
            , fVkSpec(vkInfo) {
        if (vkInfo.fFlags & VK_IMAGE_CREATE_PROTECTED_BIT) {
            fProtected = Protected::kYes;
        }
    }
#endif

    ~TextureInfo() {}
    TextureInfo(const TextureInfo&) = default;
    TextureInfo& operator=(const TextureInfo&);

    bool operator==(const TextureInfo&) const;
    bool operator!=(const TextureInfo& that) const { return !(*this == that); }

    bool isValid() const { return fValid; }
    BackendApi backend() const { return fBackend; }

    uint32_t numSamples() const { return fSampleCount; }
    uint32_t numMipLevels() const { return fLevelCount; }
    Protected isProtected() const { return fProtected; }

#ifdef SK_METAL
    bool getMtlTextureInfo(MtlTextureInfo* info) const {
        if (!this->isValid() || fBackend != BackendApi::kMetal) {
            return false;
        }
        *info = MtlTextureSpecToTextureInfo(fMtlSpec, fSampleCount, fLevelCount);
        return true;
    }
#endif

#ifdef SK_VULKAN
    bool getVulkanTextureInfo(VulkanTextureInfo* info) const {
        if (!this->isValid() || fBackend != BackendApi::kVulkan) {
            return false;
        }
        *info = VulkanTextureSpecToTextureInfo(fVkSpec, fSampleCount, fLevelCount);
        return true;
    }
#endif

private:
#ifdef SK_METAL
    friend class MtlCaps;
    friend class MtlGraphicsPipeline;
    friend class MtlTexture;
    const MtlTextureSpec& mtlTextureSpec() const {
        SkASSERT(fValid && fBackend == BackendApi::kMetal);
        return fMtlSpec;
    }
#endif

#ifdef SK_VULKAN
    friend class VulkanCaps;
    friend class VulkanTexture;
    const VulkanTextureSpec& vulkanTextureSpec() const {
        SkASSERT(fValid && fBackend == BackendApi::kVulkan);
        return fVkSpec;
    }
#endif

    BackendApi fBackend = BackendApi::kMock;
    bool fValid = false;

    uint32_t fSampleCount = 1;
    uint32_t fLevelCount = 0;
    Protected fProtected = Protected::kNo;

    union {
#ifdef SK_METAL
        MtlTextureSpec fMtlSpec;
#endif
#ifdef SK_VULKAN
        VulkanTextureSpec fVkSpec;
#endif
    };
};

}  // namespace skgpu::graphite

#endif  //skgpu_graphite_TextureInfo_DEFINED
