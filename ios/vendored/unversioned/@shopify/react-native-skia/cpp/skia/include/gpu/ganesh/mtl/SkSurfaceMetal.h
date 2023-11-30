/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSurfaceMetal_DEFINED
#define SkSurfaceMetal_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkSurface.h"
#include "include/gpu/GrTypes.h"
#include "include/gpu/ganesh/SkSurfaceGanesh.h"
#include "include/gpu/mtl/GrMtlTypes.h"

namespace SkSurfaces {
/** Creates SkSurface from CAMetalLayer.
    Returned SkSurface takes a reference on the CAMetalLayer. The ref on the layer will be
    released when the SkSurface is destroyed.

    Only available when Metal API is enabled.

    Will grab the current drawable from the layer and use its texture as a backendRT to
    create a renderable surface.

    @param context         GPU context
    @param layer           GrMTLHandle (expected to be a CAMetalLayer*)
    @param sampleCnt       samples per pixel, or 0 to disable full scene anti-aliasing
    @param colorSpace      range of colors; may be nullptr
    @param surfaceProps    LCD striping orientation and setting for device independent
                           fonts; may be nullptr
    @param drawable        Pointer to drawable to be filled in when this surface is
                           instantiated; may not be nullptr
    @return                created SkSurface, or nullptr
 */
SK_API sk_sp<SkSurface> WrapCAMetalLayer(GrRecordingContext* context,
                                         GrMTLHandle layer,
                                         GrSurfaceOrigin origin,
                                         int sampleCnt,
                                         SkColorType colorType,
                                         sk_sp<SkColorSpace> colorSpace,
                                         const SkSurfaceProps* surfaceProps,
                                         GrMTLHandle* drawable) SK_API_AVAILABLE_CA_METAL_LAYER;

/** Creates SkSurface from MTKView.
    Returned SkSurface takes a reference on the MTKView. The ref on the layer will be
    released when the SkSurface is destroyed.

    Only available when Metal API is enabled.

    Will grab the current drawable from the layer and use its texture as a backendRT to
    create a renderable surface.

    @param context         GPU context
    @param layer           GrMTLHandle (expected to be a MTKView*)
    @param sampleCnt       samples per pixel, or 0 to disable full scene anti-aliasing
    @param colorSpace      range of colors; may be nullptr
    @param surfaceProps    LCD striping orientation and setting for device independent
                           fonts; may be nullptr
    @return                created SkSurface, or nullptr
 */
SK_API sk_sp<SkSurface> WrapMTKView(GrRecordingContext* context,
                                    GrMTLHandle mtkView,
                                    GrSurfaceOrigin origin,
                                    int sampleCnt,
                                    SkColorType colorType,
                                    sk_sp<SkColorSpace> colorSpace,
                                    const SkSurfaceProps* surfaceProps)
        SK_API_AVAILABLE(macos(10.11), ios(9.0), tvos(9.0));
}  // namespace SkSurfaces

#endif
