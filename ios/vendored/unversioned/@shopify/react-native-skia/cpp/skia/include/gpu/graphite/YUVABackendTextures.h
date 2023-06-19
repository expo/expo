/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_YUVABackendTextures_DEFINED
#define skgpu_graphite_YUVABackendTextures_DEFINED

#include "include/core/SkSpan.h"
#include "include/core/SkYUVAInfo.h"
#include "include/gpu/graphite/BackendTexture.h"

#include <tuple>

namespace skgpu::graphite {
class Recorder;

/**
 * A description of a set of BackendTextures that hold the planar data described by a SkYUVAInfo.
 */
class SK_API YUVABackendTextureInfo {
public:
    static constexpr auto kMaxPlanes = SkYUVAInfo::kMaxPlanes;

    /** Default YUVABackendTextureInfo is invalid. */
    YUVABackendTextureInfo() = default;
    YUVABackendTextureInfo(const YUVABackendTextureInfo&) = default;
    YUVABackendTextureInfo& operator=(const YUVABackendTextureInfo&) = default;

    /**
     * Initializes a YUVABackendTextureInfo to describe a set of textures that can store the
     * planes indicated by the SkYUVAInfo. The texture dimensions are taken from the SkYUVAInfo's
     * plane dimensions. All the described textures share a common origin. The planar image this
     * describes will be mip mapped if all the textures are individually mip mapped as indicated
     * by Mipmapped. This will produce an invalid result (return false from isValid()) if the
     * passed formats' channels don't agree with SkYUVAInfo.
     */
    YUVABackendTextureInfo(const Recorder*,
                           const SkYUVAInfo&,
                           const TextureInfo[kMaxPlanes],
                           Mipmapped);

    bool operator==(const YUVABackendTextureInfo&) const;
    bool operator!=(const YUVABackendTextureInfo& that) const { return !(*this == that); }

    /** TextureInfo for the ith plane, or invalid if i >= numPlanes() */
    const TextureInfo& planeTextureInfo(int i) const {
        SkASSERT(i >= 0);
        return fPlaneTextureInfos[static_cast<size_t>(i)];
    }

    const SkYUVAInfo& yuvaInfo() const { return fYUVAInfo; }

    SkYUVColorSpace yuvColorSpace() const { return fYUVAInfo.yuvColorSpace(); }

    Mipmapped mipmapped() const { return fMipmapped; }

    /** The number of planes, 0 if this YUVABackendTextureInfo is invalid. */
    int numPlanes() const { return fYUVAInfo.numPlanes(); }

    /**
     * Returns true if this has been configured with a valid SkYUVAInfo with compatible texture
     * formats.
     */
    bool isValid() const { return fYUVAInfo.isValid(); }

    /**
     * Computes a YUVALocations representation of the planar layout. The result is guaranteed to be
     * valid if this->isValid().
     */
    SkYUVAInfo::YUVALocations toYUVALocations() const;

private:
    SkYUVAInfo fYUVAInfo;
    std::array<TextureInfo, kMaxPlanes> fPlaneTextureInfos;
    std::array<uint32_t, kMaxPlanes> fPlaneChannelMasks;
    Mipmapped fMipmapped = Mipmapped::kNo;
};

/**
 * A set of BackendTextures that hold the planar data for an image described a SkYUVAInfo.
 */
class SK_API YUVABackendTextures {
public:
    static constexpr auto kMaxPlanes = SkYUVAInfo::kMaxPlanes;

    YUVABackendTextures() = default;
    YUVABackendTextures(const YUVABackendTextures&) = delete;
    YUVABackendTextures& operator=(const YUVABackendTextures&) = delete;

    /**
     * Initializes a YUVABackendTextures object from a set of textures that store the planes
     * indicated by the SkYUVAInfo. This will produce an invalid result (return false from
     * isValid()) if the passed texture formats' channels don't agree with SkYUVAInfo.
     */
    YUVABackendTextures(const Recorder*,
                        const SkYUVAInfo&,
                        const BackendTexture[kMaxPlanes]);

    SkSpan<const BackendTexture> planeTextures() const {
        return SkSpan<const BackendTexture>(fPlaneTextures);
    }

    /** BackendTexture for the ith plane, or invalid if i >= numPlanes() */
    BackendTexture planeTexture(int i) const {
        SkASSERT(i >= 0);
        return fPlaneTextures[static_cast<size_t>(i)];
    }

    const SkYUVAInfo& yuvaInfo() const { return fYUVAInfo; }

    SkYUVColorSpace yuvColorSpace() const { return fYUVAInfo.yuvColorSpace(); }

    /** The number of planes, 0 if this YUVABackendTextureInfo is invalid. */
    int numPlanes() const { return fYUVAInfo.numPlanes(); }

    /**
     * Returns true if this has been configured with a valid SkYUVAInfo with compatible texture
     * formats.
     */
    bool isValid() const { return fYUVAInfo.isValid(); }

    /**
     * Computes a YUVALocations representation of the planar layout. The result is guaranteed to be
     * valid if this->isValid().
     */
    SkYUVAInfo::YUVALocations toYUVALocations() const;

private:
    SkYUVAInfo fYUVAInfo;
    std::array<BackendTexture, kMaxPlanes> fPlaneTextures;
    std::array<uint32_t, kMaxPlanes> fPlaneChannelMasks;
};

}  // End of namespace skgpu::graphite

#endif  // skgpu_graphite_YUVABackendTextures_DEFINED
