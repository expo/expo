/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSurfaceAndroid_DEFINED
#define SkSurfaceAndroid_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkSurface.h"
#include "include/gpu/GrTypes.h"

class SkColorSpace;
class GrDirectContext;
class SkPixmap;
struct AHardwareBuffer;

namespace SkSurfaces {

/** Private; only to be used by Android Framework.
    Creates SkSurface from Android hardware buffer.
    Returned SkSurface takes a reference on the buffer. The ref on the buffer will be released
    when the SkSurface is destroyed and there is no pending work on the GPU involving the
    buffer.

    Currently this is only supported for buffers that can be textured as well as rendered to.
    In other words that must have both AHARDWAREBUFFER_USAGE_GPU_COLOR_OUTPUT and
    AHARDWAREBUFFER_USAGE_GPU_SAMPLED_IMAGE usage bits.

    @param context         GPU context
    @param hardwareBuffer  AHardwareBuffer Android hardware buffer
    @param colorSpace      range of colors; may be nullptr
    @param surfaceProps    LCD striping orientation and setting for device independent
                           fonts; may be nullptr
    @param fromWindow      Whether or not the AHardwareBuffer is part of an Android Window.
                           Currently only used with Vulkan backend.
    @return                created SkSurface, or nullptr
*/
SK_API sk_sp<SkSurface> WrapAndroidHardwareBuffer(GrDirectContext* context,
                                                  AHardwareBuffer* hardwareBuffer,
                                                  GrSurfaceOrigin origin,
                                                  sk_sp<SkColorSpace> colorSpace,
                                                  const SkSurfaceProps* surfaceProps,
                                                  bool fromWindow = false);

}  // namespace SkSurfaces

#endif
