/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_GraphiteTypes_DEFINED
#define skgpu_graphite_GraphiteTypes_DEFINED

#include "include/core/SkTypes.h"
#include "include/gpu/GpuTypes.h"

#include <memory>

namespace skgpu::graphite {

class Recording;

using GpuFinishedContext = void*;
using GpuFinishedProc = void (*)(GpuFinishedContext finishedContext, CallbackResult);

/**
 * The fFinishedProc is called when the Recording has been submitted and finished on the GPU, or
 * when there is a failure that caused it not to be submitted. The callback will always be called
 * and the caller can use the callback to know it is safe to free any resources associated with
 * the Recording that they may be holding onto. If the Recording is successfully submitted to the
 * GPU the callback will be called with CallbackResult::kSuccess once the GPU has finished. All
 * other cases where some failure occured it will be called with CallbackResult::kFailed.
 */
struct InsertRecordingInfo {
    Recording* fRecording = nullptr;
    GpuFinishedContext fFinishedContext = nullptr;
    GpuFinishedProc fFinishedProc = nullptr;
};

/**
 * Actually submit work to the GPU and track its completion
 */
enum class SyncToCpu : bool {
    kYes = true,
    kNo = false
};

/**
 * Possible 3D APIs that may be used by Graphite.
 */
enum class BackendApi : unsigned {
    kMetal,
    kMock,
};

/**
 * Is the texture mipmapped or not
 */
enum class Mipmapped: bool {
    kNo = false,
    kYes = true,
};

/**
 * Is the data protected on the GPU or not.
 */
enum class Protected : bool {
    kNo = false,
    kYes = true,
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_GraphiteTypes_DEFINED
