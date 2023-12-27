/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_GraphiteTypes_DEFINED
#define skgpu_graphite_GraphiteTypes_DEFINED

#include "include/core/SkPoint.h"
#include "include/core/SkTypes.h"
#include "include/gpu/GpuTypes.h"

#include <memory>

class SkSurface;

namespace skgpu {
class MutableTextureState;
}

namespace skgpu::graphite {

class BackendSemaphore;
class Recording;
class Task;

using GpuFinishedContext = void*;
using GpuFinishedProc = void (*)(GpuFinishedContext finishedContext, CallbackResult);

/**
 * The fFinishedProc is called when the Recording has been submitted and finished on the GPU, or
 * when there is a failure that caused it not to be submitted. The callback will always be called
 * and the caller can use the callback to know it is safe to free any resources associated with
 * the Recording that they may be holding onto. If the Recording is successfully submitted to the
 * GPU the callback will be called with CallbackResult::kSuccess once the GPU has finished. All
 * other cases where some failure occured it will be called with CallbackResult::kFailed.
 *
 * The fTargetSurface, if provided, is used as a target for any draws recorded onto a deferred
 * canvas returned from Recorder::makeDeferredCanvas. This target surface must be provided iff
 * the Recording contains any such draws. It must be Graphite-backed and its backing texture's
 * TextureInfo must match the info provided to the Recorder when making the deferred canvas.
 *
 * fTargetTranslation is an additional translation applied to draws targeting fTargetSurface.
 *
 * The client may pass in two arrays of initialized BackendSemaphores to be included in the
 * command stream. At some time before issuing commands in the Recording, the fWaitSemaphores will
 * be waited on by the gpu. Similarly, at some time after issuing the Recording's commands, the
 * fSignalSemaphores will be signaled by the gpu. Depending on the platform, the timing of the wait
 * and signal operations will either be immediately before or after the given Recording's command
 * stream, respectively, or before and after the entire CommandBuffer's command stream. The
 * semaphores are not sent to the GPU until the next Context::submit call is made.
 *
 * The client will own and be responsible for deleting the underlying semaphore objects after the
 * submission completes, however the BackendSemaphore objects themselves can be deleted as soon
 * as this function returns.
 */
struct InsertRecordingInfo {
    Recording* fRecording = nullptr;

    SkSurface* fTargetSurface = nullptr;
    SkIVector fTargetTranslation = {0, 0};
    MutableTextureState* fTargetTextureState = nullptr;

    size_t fNumWaitSemaphores = 0;
    BackendSemaphore* fWaitSemaphores = nullptr;
    size_t fNumSignalSemaphores = 0;
    BackendSemaphore* fSignalSemaphores = nullptr;

    GpuFinishedContext fFinishedContext = nullptr;
    GpuFinishedProc fFinishedProc = nullptr;
};

/**
 * The fFinishedProc is called when the Recording has been submitted and finished on the GPU, or
 * when there is a failure that caused it not to be submitted. The callback will always be called
 * and the caller can use the callback to know it is safe to free any resources associated with
 * the Recording that they may be holding onto. If the Recording is successfully submitted to the
 * GPU the callback will be called with CallbackResult::kSuccess once the GPU has finished. All
 * other cases where some failure occured it will be called with CallbackResult::kFailed.
 */
struct InsertFinishInfo {
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

/*
 * For Promise Images - should the Promise Image be fulfilled every time a Recording that references
 * it is inserted into the Context.
 */
enum class Volatile : bool {
    kNo = false,              // only fulfilled once
    kYes = true               // fulfilled on every insertion call
};

/*
 * Graphite's different rendering methods each only apply to certain types of draws. This
 * enum supports decision-making regarding the different renderers and what is being drawn.
 */
enum DrawTypeFlags : uint8_t {

    kNone         = 0b000,

    // SkCanvas:: drawSimpleText, drawString, drawGlyphs, drawTextBlob, drawSlug
    kText         = 0b001,

    // SkCanvas::drawVertices
    kDrawVertices = 0b010,

    // All other canvas draw calls
    kShape        = 0b100,

    kMostCommon = kText | kShape,
    kAll = kText | kDrawVertices | kShape
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_GraphiteTypes_DEFINED
