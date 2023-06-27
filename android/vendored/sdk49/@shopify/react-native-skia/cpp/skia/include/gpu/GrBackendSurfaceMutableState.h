/*
 * Copyright 2020 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrBackendSurfaceMutableState_DEFINED
#define GrBackendSurfaceMutableState_DEFINED

#include "include/gpu/MutableTextureState.h"

class GrBackendSurfaceMutableState : public skgpu::MutableTextureState {
public:
    GrBackendSurfaceMutableState() = default;

#ifdef SK_VULKAN
    GrBackendSurfaceMutableState(VkImageLayout layout, uint32_t queueFamilyIndex)
            : skgpu::MutableTextureState(layout, queueFamilyIndex) {}
#endif

    GrBackendSurfaceMutableState(const GrBackendSurfaceMutableState& that)
            : skgpu::MutableTextureState(that) {}
};

#endif
