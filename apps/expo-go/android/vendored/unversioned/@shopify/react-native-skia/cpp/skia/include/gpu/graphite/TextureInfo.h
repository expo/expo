/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_TextureInfo_DEFINED
#define skgpu_graphite_TextureInfo_DEFINED

#include "include/core/SkString.h"
#include "include/gpu/graphite/GraphiteTypes.h"

#ifdef SK_DAWN
#include "include/private/gpu/graphite/DawnTypesPriv.h"
#endif

#ifdef SK_METAL
#include "include/private/gpu/graphite/MtlGraphiteTypesPriv.h"
#endif

#ifdef SK_VULKAN
#include "include/private/gpu/graphite/VulkanGraphiteTypesPriv.h"
#endif

struct SkISize;

namespace skgpu::graphite {

class SK_API TextureInfo {
public:
    TextureInfo() {}
#ifdef SK_DAWN
    TextureInfo(const DawnTextureInfo& dawnInfo)
            : fBackend(BackendApi::kDawn)
            , fValid(true)
            , fSampleCount(dawnInfo.fSampleCount)
            , fMipmapped(dawnInfo.fMipmapped)
            , fProtected(Protected::kNo)
            , fDawnSpec(dawnInfo) {}
#endif

#ifdef SK_METAL
    TextureInfo(const MtlTextureInfo& mtlInfo)
            : fBackend(BackendApi::kMetal)
            , fValid(true)
            , fSampleCount(mtlInfo.fSampleCount)
            , fMipmapped(mtlInfo.fMipmapped)
            , fProtected(Protected::kNo)
            , fMtlSpec(mtlInfo) {}
#endif

#ifdef SK_VULKAN
    TextureInfo(const VulkanTextureInfo& vkInfo)
            : fBackend(BackendApi::kVulkan)
            , fValid(true)
            , fSampleCount(vkInfo.fSampleCount)
            , fMipmapped(vkInfo.fMipmapped)
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
    Mipmapped mipmapped() const { return fMipmapped; }
    Protected isProtected() const { return fProtected; }

#ifdef SK_DAWN
    bool getDawnTextureInfo(DawnTextureInfo* info) const;
#endif

#ifdef SK_METAL
    bool getMtlTextureInfo(MtlTextureInfo* info) const {
        if (!this->isValid() || fBackend != BackendApi::kMetal) {
            return false;
        }
        *info = MtlTextureSpecToTextureInfo(fMtlSpec, fSampleCount, fMipmapped);
        return true;
    }
#endif

#ifdef SK_VULKAN
    bool getVulkanTextureInfo(VulkanTextureInfo* info) const {
        if (!this->isValid() || fBackend != BackendApi::kVulkan) {
            return false;
        }
        *info = VulkanTextureSpecToTextureInfo(fVkSpec, fSampleCount, fMipmapped);
        return true;
    }
#endif

    bool isCompatible(const TextureInfo& that) const;
    SkString toString() const;

private:
    friend size_t ComputeSize(SkISize dimensions, const TextureInfo&);  // for bytesPerPixel

    size_t bytesPerPixel() const;

#ifdef SK_DAWN
    friend class DawnCaps;
    friend class DawnCommandBuffer;
    friend class DawnComputePipeline;
    friend class DawnGraphicsPipeline;
    friend class DawnResourceProvider;
    friend class DawnTexture;
    const DawnTextureSpec& dawnTextureSpec() const {
        SkASSERT(fValid && fBackend == BackendApi::kDawn);
        return fDawnSpec;
    }
#endif

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
    Mipmapped fMipmapped = Mipmapped::kNo;
    Protected fProtected = Protected::kNo;

    union {
#ifdef SK_DAWN
        DawnTextureSpec fDawnSpec;
#endif
#ifdef SK_METAL
        MtlTextureSpec fMtlSpec;
#endif
#ifdef SK_VULKAN
        VulkanTextureSpec fVkSpec;
#endif
        void* fEnsureUnionNonEmpty;
    };
};

}  // namespace skgpu::graphite

#endif  //skgpu_graphite_TextureInfo_DEFINED
