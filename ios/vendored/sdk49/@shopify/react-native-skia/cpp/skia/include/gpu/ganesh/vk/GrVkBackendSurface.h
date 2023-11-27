/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrVkBackendSurface_DEFINED
#define GrVkBackendSurface_DEFINED

#include "include/gpu/vk/GrVkTypes.h"
#include "include/private/base/SkAPI.h"

#include <string_view>

class GrBackendFormat;
class GrBackendTexture;
class GrBackendRenderTarget;


namespace GrBackendFormats {

SK_API GrBackendFormat MakeVk(VkFormat format, bool willUseDRMFormatModifiers = false);
SK_API GrBackendFormat MakeVk(const GrVkYcbcrConversionInfo& ycbcrInfo,
                              bool willUseDRMFormatModifiers = false);

SK_API bool AsVkFormat(const GrBackendFormat&, VkFormat*);
SK_API const GrVkYcbcrConversionInfo* GetVkYcbcrConversionInfo(const GrBackendFormat&);

}  // namespace GrBackendFormats


namespace GrBackendTextures {

SK_API GrBackendTexture MakeVk(int width,
                               int height,
                               const GrVkImageInfo&,
                               std::string_view label = {});

// If the backend API is Vulkan, copies a snapshot of the GrVkImageInfo struct into the passed
// in pointer and returns true. This snapshot will set the fImageLayout to the current layout
// state. Otherwise returns false if the backend API is not Vulkan.
SK_API bool GetVkImageInfo(const GrBackendTexture&, GrVkImageInfo*);

// Anytime the client changes the VkImageLayout of the VkImage captured by this
// GrBackendTexture, they must call this function to notify Skia of the changed layout.
SK_API void SetVkImageLayout(GrBackendTexture*, VkImageLayout);

}  // namespace GrBackendTextures


namespace GrBackendRenderTargets {

SK_API GrBackendRenderTarget MakeVk(int width, int height, const GrVkImageInfo&);

// If the backend API is Vulkan, copies a snapshot of the GrVkImageInfo struct into the passed
// in pointer and returns true. This snapshot will set the fImageLayout to the current layout
// state. Otherwise returns false if the backend API is not Vulkan.
SK_API bool GetVkImageInfo(const GrBackendRenderTarget&, GrVkImageInfo*);

// Anytime the client changes the VkImageLayout of the VkImage captured by this
// GrBackendRenderTarget, they must call this function to notify Skia of the changed layout.
SK_API void SetVkImageLayout(GrBackendRenderTarget*, VkImageLayout);

}  // namespace GrBackendRenderTargets

#endif
