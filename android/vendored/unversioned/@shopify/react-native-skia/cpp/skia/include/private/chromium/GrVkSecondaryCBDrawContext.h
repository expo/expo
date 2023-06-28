/*
 * Copyright 2019 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrVkSecondaryCBDrawContext_DEFINED
#define GrVkSecondaryCBDrawContext_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkSurfaceProps.h"
#include "include/core/SkTypes.h"

#include <memory>

class GrBackendSemaphore;
class GrRecordingContext;
struct GrVkDrawableInfo;
namespace skgpu::ganesh {
class Device;
}
class SkCanvas;
class SkDeferredDisplayList;
struct SkImageInfo;
class SkSurfaceCharacterization;
class SkSurfaceProps;

/**
 * This class is a private header that is intended to only be used inside of Chromium. This requires
 * Chromium to burrow in and include this specifically since it is not part of skia's public include
 * directory.
 */

/**
 * This class is used to draw into an external Vulkan secondary command buffer that is imported
 * by the client. The secondary command buffer that gets imported must already have had begin called
 * on it with VK_COMMAND_BUFFER_USAGE_RENDER_PASS_CONTINUE_BIT. Thus any draws to the imported
 * command buffer cannot require changing the render pass. This requirement means that certain types
 * of draws will not be supported when using a GrVkSecondaryCBDrawContext. This includes:
 *     Draws that require a dst copy for blending will be dropped
 *     Text draws will be dropped (these may require intermediate uploads of text data)
 *     Read and Write pixels will not work
 *     Any other draw that requires a copy will fail (this includes using backdrop filter with save
 *         layer).
 *     Stenciling is also disabled, but that should not restrict any actual draws from working.
 *
 * While using a GrVkSecondaryCBDrawContext, the client can also draw into normal SkSurfaces and
 * then draw those SkSufaces (as SkImages) into the GrVkSecondaryCBDrawContext. If any of the
 * previously mentioned unsupported draws are needed by the client, they can draw them into an
 * offscreen surface, and then draw that into the GrVkSecondaryCBDrawContext.
 *
 * After all drawing to the GrVkSecondaryCBDrawContext has been done, the client must call flush()
 * on the GrVkSecondaryCBDrawContext to actually fill in the secondary VkCommandBuffer with the
 * draws.
 *
 * Additionally, the client must keep the GrVkSecondaryCBDrawContext alive until the secondary
 * VkCommandBuffer has been submitted and all work finished on the GPU. Before deleting the
 * GrVkSecondaryCBDrawContext, the client must call releaseResources() so that Skia can cleanup
 * any internal objects that were created for the draws into the secondary command buffer.
 */
class SK_SPI GrVkSecondaryCBDrawContext : public SkRefCnt {
public:
    static sk_sp<GrVkSecondaryCBDrawContext> Make(GrRecordingContext*,
                                                  const SkImageInfo&,
                                                  const GrVkDrawableInfo&,
                                                  const SkSurfaceProps* props);

    ~GrVkSecondaryCBDrawContext() override;

    SkCanvas* getCanvas();

    // Records all the draws to the imported secondary command buffer and sets any dependent
    // offscreen draws to the GPU.
    void flush();

    /** Inserts a list of GPU semaphores that Skia will have the driver wait on before executing
        commands for this secondary CB. The wait semaphores will get added to the VkCommandBuffer
        owned by this GrContext when flush() is called, and not the command buffer which the
        Secondary CB is from. This will guarantee that the driver waits on the semaphores before
        the secondary command buffer gets executed. If this call returns false, then the GPU
        back end will not wait on any passed in semaphores, and the client will still own the
        semaphores, regardless of the value of deleteSemaphoresAfterWait.

        If deleteSemaphoresAfterWait is false then Skia will not delete the semaphores. In this case
        it is the client's responsibility to not destroy or attempt to reuse the semaphores until it
        knows that Skia has finished waiting on them. This can be done by using finishedProcs
        on flush calls.

        @param numSemaphores               size of waitSemaphores array
        @param waitSemaphores              array of semaphore containers
        @paramm deleteSemaphoresAfterWait  who owns and should delete the semaphores
        @return                            true if GPU is waiting on semaphores
    */
    bool wait(int numSemaphores,
              const GrBackendSemaphore waitSemaphores[],
              bool deleteSemaphoresAfterWait = true);

    // This call will release all resources held by the draw context. The client must call
    // releaseResources() before deleting the drawing context. However, the resources also include
    // any Vulkan resources that were created and used for draws. Therefore the client must only
    // call releaseResources() after submitting the secondary command buffer, and waiting for it to
    // finish on the GPU. If it is called earlier then some vulkan objects may be deleted while they
    // are still in use by the GPU.
    void releaseResources();

    const SkSurfaceProps& props() const { return fProps; }

    // TODO: Fill out these calls to support DDL
    bool characterize(SkSurfaceCharacterization* characterization) const;

#ifndef SK_DDL_IS_UNIQUE_POINTER
    bool draw(sk_sp<const SkDeferredDisplayList> deferredDisplayList);
#else
    bool draw(const SkDeferredDisplayList* deferredDisplayList);
#endif

    bool isCompatible(const SkSurfaceCharacterization& characterization) const;

private:
    explicit GrVkSecondaryCBDrawContext(sk_sp<skgpu::ganesh::Device>, const SkSurfaceProps*);

    sk_sp<skgpu::ganesh::Device> fDevice;
    std::unique_ptr<SkCanvas> fCachedCanvas;
    const SkSurfaceProps      fProps;

    using INHERITED = SkRefCnt;
};

#endif
