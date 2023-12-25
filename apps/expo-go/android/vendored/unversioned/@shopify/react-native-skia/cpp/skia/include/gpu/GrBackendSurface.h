/*
 * Copyright 2017 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrBackendSurface_DEFINED
#define GrBackendSurface_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkSize.h"
#include "include/gpu/GpuTypes.h"
#include "include/gpu/GrTypes.h"
#include "include/private/base/SkAPI.h"
#include "include/private/base/SkAnySubclass.h"
#include "include/private/gpu/ganesh/GrTypesPriv.h"

#include "include/gpu/mock/GrMockTypes.h"

enum class SkTextureCompressionType;
class GrBackendFormatData;
class GrBackendTextureData;
class GrBackendRenderTargetData;

namespace skgpu {
class MutableTextureState;
class MutableTextureStateRef;
}

#ifdef SK_METAL
#include "include/gpu/mtl/GrMtlTypes.h"
#endif

#ifdef SK_DIRECT3D
#include "include/private/gpu/ganesh/GrD3DTypesMinimal.h"
class GrD3DResourceState;
#endif

#if defined(SK_DEBUG) || defined(GR_TEST_UTILS)
class SkString;
#endif

#include <cstddef>
#include <cstdint>
#include <string>
#include <string_view>

class SK_API GrBackendFormat {
public:
    // Creates an invalid backend format.
    GrBackendFormat();
    GrBackendFormat(const GrBackendFormat&);
    GrBackendFormat& operator=(const GrBackendFormat&);
    ~GrBackendFormat();

#ifdef SK_METAL
    static GrBackendFormat MakeMtl(GrMTLPixelFormat format) {
        return GrBackendFormat(format);
    }
#endif

#ifdef SK_DIRECT3D
    static GrBackendFormat MakeDxgi(DXGI_FORMAT format) {
        return GrBackendFormat(format);
    }
#endif

    static GrBackendFormat MakeMock(GrColorType colorType,
                                    SkTextureCompressionType compression,
                                    bool isStencilFormat = false);

    bool operator==(const GrBackendFormat& that) const;
    bool operator!=(const GrBackendFormat& that) const { return !(*this == that); }

    GrBackendApi backend() const { return fBackend; }
    GrTextureType textureType() const { return fTextureType; }

    /**
     * Gets the channels present in the format as a bitfield of SkColorChannelFlag values.
     * Luminance channels are reported as kGray_SkColorChannelFlag.
     */
    uint32_t channelMask() const;

    GrColorFormatDesc desc() const;

#ifdef SK_METAL
    /**
     * If the backend API is Metal this gets the format as a GrMtlPixelFormat. Otherwise,
     * Otherwise, returns MTLPixelFormatInvalid.
     */
    GrMTLPixelFormat asMtlFormat() const;
#endif

#ifdef SK_DIRECT3D
    /**
     * If the backend API is Direct3D this gets the format as a DXGI_FORMAT and returns true.
     * Otherwise, returns false.
     */
    bool asDxgiFormat(DXGI_FORMAT*) const;
#endif

    /**
     * If the backend API is not Mock these three calls will return kUnknown, kNone or false,
     * respectively. Otherwise, only one of the following can be true. The GrColorType is not
     * kUnknown, the compression type is not kNone, or this is a mock stencil format.
     */
    GrColorType asMockColorType() const;
    SkTextureCompressionType asMockCompressionType() const;
    bool isMockStencilFormat() const;

    // If possible, copies the GrBackendFormat and forces the texture type to be Texture2D. If the
    // GrBackendFormat was for Vulkan and it originally had a GrVkYcbcrConversionInfo, we will
    // remove the conversion and set the format to be VK_FORMAT_R8G8B8A8_UNORM.
    GrBackendFormat makeTexture2D() const;

    // Returns true if the backend format has been initialized.
    bool isValid() const { return fValid; }

#if defined(SK_DEBUG) || defined(GR_TEST_UTILS)
    SkString toStr() const;
#endif

private:
    // Size determined by looking at the GrBackendFormatData subclasses, then guessing-and-checking.
    // Compiler will complain if this is too small - in that case, just increase the number.
    inline constexpr static size_t kMaxSubclassSize = 64;
    using AnyFormatData = SkAnySubclass<GrBackendFormatData, kMaxSubclassSize>;

    friend class GrBackendSurfacePriv;
    friend class GrBackendFormatData;

    // Used by internal factories. Should not be used externally. Use factories like
    // GrBackendFormats::MakeGL instead.
    template <typename FormatData>
    GrBackendFormat(GrTextureType textureType, GrBackendApi api, const FormatData& formatData)
            : fBackend(api), fValid(true), fTextureType(textureType) {
        fFormatData.emplace<FormatData>(formatData);
    }

#ifdef SK_METAL
    GrBackendFormat(const GrMTLPixelFormat mtlFormat);
#endif

#ifdef SK_DIRECT3D
    GrBackendFormat(DXGI_FORMAT dxgiFormat);
#endif

    GrBackendFormat(GrColorType, SkTextureCompressionType, bool isStencilFormat);

#ifdef SK_DEBUG
    bool validateMock() const;
#endif

    GrBackendApi fBackend = GrBackendApi::kMock;
    bool fValid = false;
    AnyFormatData fFormatData;

    union {
#ifdef SK_METAL
        GrMTLPixelFormat fMtlFormat;
#endif

#ifdef SK_DIRECT3D
        DXGI_FORMAT fDxgiFormat;
#endif
        struct {
            GrColorType fColorType;
            SkTextureCompressionType fCompressionType;
            bool fIsStencilFormat;
        } fMock;
    };
    GrTextureType fTextureType = GrTextureType::kNone;
};

class SK_API GrBackendTexture {
public:
    // Creates an invalid backend texture.
    GrBackendTexture();

#ifdef SK_METAL
    GrBackendTexture(int width,
                     int height,
                     skgpu::Mipmapped,
                     const GrMtlTextureInfo& mtlInfo,
                     std::string_view label = {});
#endif

#ifdef SK_DIRECT3D
    GrBackendTexture(int width,
                     int height,
                     const GrD3DTextureResourceInfo& d3dInfo,
                     std::string_view label = {});
#endif

    GrBackendTexture(int width,
                     int height,
                     skgpu::Mipmapped,
                     const GrMockTextureInfo& mockInfo,
                     std::string_view label = {});

    GrBackendTexture(const GrBackendTexture& that);

    ~GrBackendTexture();

    GrBackendTexture& operator=(const GrBackendTexture& that);

    SkISize dimensions() const { return {fWidth, fHeight}; }
    int width() const { return fWidth; }
    int height() const { return fHeight; }
    std::string_view getLabel() const { return fLabel; }
    skgpu::Mipmapped mipmapped() const { return fMipmapped; }
    bool hasMipmaps() const { return fMipmapped == skgpu::Mipmapped::kYes; }
    /** deprecated alias of hasMipmaps(). */
    bool hasMipMaps() const { return this->hasMipmaps(); }
    GrBackendApi backend() const {return fBackend; }
    GrTextureType textureType() const { return fTextureType; }

#ifdef SK_METAL
    // If the backend API is Metal, copies a snapshot of the GrMtlTextureInfo struct into the passed
    // in pointer and returns true. Otherwise returns false if the backend API is not Metal.
    bool getMtlTextureInfo(GrMtlTextureInfo*) const;
#endif

#ifdef SK_DIRECT3D
    // If the backend API is Direct3D, copies a snapshot of the GrD3DTextureResourceInfo struct into
    // the passed in pointer and returns true. This snapshot will set the fResourceState to the
    // current resource state. Otherwise returns false if the backend API is not D3D.
    bool getD3DTextureResourceInfo(GrD3DTextureResourceInfo*) const;

    // Anytime the client changes the D3D12_RESOURCE_STATES of the D3D12_RESOURCE captured by this
    // GrBackendTexture, they must call this function to notify Skia of the changed layout.
    void setD3DResourceState(GrD3DResourceStateEnum);
#endif

    // Get the GrBackendFormat for this texture (or an invalid format if this is not valid).
    GrBackendFormat getBackendFormat() const;

    // If the backend API is Mock, copies a snapshot of the GrMockTextureInfo struct into the passed
    // in pointer and returns true. Otherwise returns false if the backend API is not Mock.
    bool getMockTextureInfo(GrMockTextureInfo*) const;

    // If the client changes any of the mutable backend of the GrBackendTexture they should call
    // this function to inform Skia that those values have changed. The backend API specific state
    // that can be set from this function are:
    //
    // Vulkan: VkImageLayout and QueueFamilyIndex
    void setMutableState(const skgpu::MutableTextureState&);

    // Returns true if we are working with protected content.
    bool isProtected() const;

    // Returns true if the backend texture has been initialized.
    bool isValid() const { return fIsValid; }

    // Returns true if both textures are valid and refer to the same API texture.
    bool isSameTexture(const GrBackendTexture&);

#if defined(GR_TEST_UTILS)
    static bool TestingOnly_Equals(const GrBackendTexture&, const GrBackendTexture&);
#endif

private:
    // Size determined by looking at the GrBackendTextureData subclasses, then guessing-and-checking.
    // Compiler will complain if this is too small - in that case, just increase the number.
    inline constexpr static size_t kMaxSubclassSize = 160;
    using AnyTextureData = SkAnySubclass<GrBackendTextureData, kMaxSubclassSize>;

    friend class GrBackendSurfacePriv;
    friend class GrBackendTextureData;

    // Used by internal factories. Should not be used externally. Use factories like
    // GrBackendTextures::MakeGL instead.
    template <typename TextureData>
    GrBackendTexture(int width,
                     int height,
                     std::string_view label,
                     skgpu::Mipmapped mipped,
                     GrBackendApi backend,
                     GrTextureType texture,
                     const TextureData& textureData)
            : fIsValid(true)
            , fWidth(width)
            , fHeight(height)
            , fLabel(label)
            , fMipmapped(mipped)
            , fBackend(backend)
            , fTextureType(texture) {
        fTextureData.emplace<TextureData>(textureData);
    }

    friend class GrVkGpu;  // for getMutableState
    sk_sp<skgpu::MutableTextureStateRef> getMutableState() const;

#ifdef SK_DIRECT3D
    friend class GrD3DTexture;
    friend class GrD3DGpu;     // for getGrD3DResourceState
    GrBackendTexture(int width,
                     int height,
                     const GrD3DTextureResourceInfo& vkInfo,
                     sk_sp<GrD3DResourceState> state,
                     std::string_view label = {});
    sk_sp<GrD3DResourceState> getGrD3DResourceState() const;
#endif

    // Free and release and resources being held by the GrBackendTexture.
    void cleanup();

    bool fIsValid;
    int fWidth;         //<! width in pixels
    int fHeight;        //<! height in pixels
    const std::string fLabel;
    skgpu::Mipmapped fMipmapped;
    GrBackendApi fBackend;
    GrTextureType fTextureType;
    AnyTextureData fTextureData;

    union {
        GrMockTextureInfo fMockInfo;
#ifdef SK_DIRECT3D
        GrD3DBackendSurfaceInfo fD3DInfo;
#endif
    };
#ifdef SK_METAL
    GrMtlTextureInfo fMtlInfo;
#endif
};

class SK_API GrBackendRenderTarget {
public:
    // Creates an invalid backend texture.
    GrBackendRenderTarget();

#ifdef SK_METAL
    GrBackendRenderTarget(int width,
                          int height,
                          const GrMtlTextureInfo& mtlInfo);
#endif

#ifdef SK_DIRECT3D
    GrBackendRenderTarget(int width,
                          int height,
                          const GrD3DTextureResourceInfo& d3dInfo);
#endif

    GrBackendRenderTarget(int width,
                          int height,
                          int sampleCnt,
                          int stencilBits,
                          const GrMockRenderTargetInfo& mockInfo);

    ~GrBackendRenderTarget();

    GrBackendRenderTarget(const GrBackendRenderTarget& that);
    GrBackendRenderTarget& operator=(const GrBackendRenderTarget&);

    SkISize dimensions() const { return {fWidth, fHeight}; }
    int width() const { return fWidth; }
    int height() const { return fHeight; }
    int sampleCnt() const { return fSampleCnt; }
    int stencilBits() const { return fStencilBits; }
    GrBackendApi backend() const {return fBackend; }
    bool isFramebufferOnly() const { return fFramebufferOnly; }

#ifdef SK_METAL
    // If the backend API is Metal, copies a snapshot of the GrMtlTextureInfo struct into the passed
    // in pointer and returns true. Otherwise returns false if the backend API is not Metal.
    bool getMtlTextureInfo(GrMtlTextureInfo*) const;
#endif

#ifdef SK_DIRECT3D
    // If the backend API is Direct3D, copies a snapshot of the GrMtlTextureInfo struct into the
    // passed in pointer and returns true. Otherwise returns false if the backend API is not D3D.
    bool getD3DTextureResourceInfo(GrD3DTextureResourceInfo*) const;

    // Anytime the client changes the D3D12_RESOURCE_STATES of the D3D12_RESOURCE captured by this
    // GrBackendTexture, they must call this function to notify Skia of the changed layout.
    void setD3DResourceState(GrD3DResourceStateEnum);
#endif

    // Get the GrBackendFormat for this render target (or an invalid format if this is not valid).
    GrBackendFormat getBackendFormat() const;

    // If the backend API is Mock, copies a snapshot of the GrMockTextureInfo struct into the passed
    // in pointer and returns true. Otherwise returns false if the backend API is not Mock.
    bool getMockRenderTargetInfo(GrMockRenderTargetInfo*) const;

    // If the client changes any of the mutable backend of the GrBackendTexture they should call
    // this function to inform Skia that those values have changed. The backend API specific state
    // that can be set from this function are:
    //
    // Vulkan: VkImageLayout and QueueFamilyIndex
    void setMutableState(const skgpu::MutableTextureState&);

    // Returns true if we are working with protected content.
    bool isProtected() const;

    // Returns true if the backend texture has been initialized.
    bool isValid() const { return fIsValid; }

#if defined(GR_TEST_UTILS)
    static bool TestingOnly_Equals(const GrBackendRenderTarget&, const GrBackendRenderTarget&);
#endif

private:
    // Size determined by looking at the GrBackendRenderTargetData subclasses, then
    // guessing-and-checking. Compiler will complain if this is too small - in that case, just
    // increase the number.
    inline constexpr static size_t kMaxSubclassSize = 160;
    using AnyRenderTargetData = SkAnySubclass<GrBackendRenderTargetData, kMaxSubclassSize>;

    friend class GrBackendSurfacePriv;
    friend class GrBackendRenderTargetData;

    // Used by internal factories. Should not be used externally. Use factories like
    // GrBackendRenderTargets::MakeGL instead.
    template <typename RenderTargetData>
    GrBackendRenderTarget(int width,
                          int height,
                          int sampleCnt,
                          int stencilBits,
                          GrBackendApi backend,
                          bool framebufferOnly,
                          const RenderTargetData& rtData)
            : fIsValid(true)
            , fFramebufferOnly(framebufferOnly)
            , fWidth(width)
            , fHeight(height)
            , fSampleCnt(sampleCnt)
            , fStencilBits(stencilBits)
            , fBackend(backend) {
        fRTData.emplace<RenderTargetData>(rtData);
    }

    friend class GrVkGpu; // for getMutableState
    sk_sp<skgpu::MutableTextureStateRef> getMutableState() const;

#ifdef SK_DIRECT3D
    friend class GrD3DGpu;
    friend class GrD3DRenderTarget;
    GrBackendRenderTarget(int width,
                          int height,
                          const GrD3DTextureResourceInfo& d3dInfo,
                          sk_sp<GrD3DResourceState> state);
    sk_sp<GrD3DResourceState> getGrD3DResourceState() const;
#endif

    // Free and release and resources being held by the GrBackendTexture.
    void cleanup();

    bool fIsValid;
    bool fFramebufferOnly = false;
    int fWidth;         //<! width in pixels
    int fHeight;        //<! height in pixels

    int fSampleCnt;
    int fStencilBits;

    GrBackendApi fBackend;
    AnyRenderTargetData fRTData;

    union {
        GrMockRenderTargetInfo fMockInfo;
#ifdef SK_DIRECT3D
        GrD3DBackendSurfaceInfo fD3DInfo;
#endif
    };
#ifdef SK_METAL
    GrMtlTextureInfo fMtlInfo;
#endif
};

#endif
