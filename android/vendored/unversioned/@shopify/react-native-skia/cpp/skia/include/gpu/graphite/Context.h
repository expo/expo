/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_Context_DEFINED
#define skgpu_graphite_Context_DEFINED

#include "include/core/SkImage.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkShader.h"
#include "include/gpu/graphite/ContextOptions.h"
#include "include/gpu/graphite/GraphiteTypes.h"
#include "include/gpu/graphite/Recorder.h"
#include "include/private/base/SingleOwner.h"

#include <chrono>
#include <functional>
#include <memory>

class SkColorSpace;
class SkRuntimeEffect;

namespace skgpu::graphite {

class BackendTexture;
class Buffer;
class ClientMappedBufferManager;
class Context;
class ContextPriv;
class GlobalCache;
class PaintOptions;
class PlotUploadTracker;
class QueueManager;
class Recording;
class ResourceProvider;
class SharedContext;
class TextureProxy;

class SK_API Context final {
public:
    Context(const Context&) = delete;
    Context(Context&&) = delete;
    Context& operator=(const Context&) = delete;
    Context& operator=(Context&&) = delete;

    ~Context();

    BackendApi backend() const;

    std::unique_ptr<Recorder> makeRecorder(const RecorderOptions& = {});

    bool insertRecording(const InsertRecordingInfo&);
    bool submit(SyncToCpu = SyncToCpu::kNo);

    void asyncRescaleAndReadPixels(const SkImage* image,
                                   const SkImageInfo& dstImageInfo,
                                   const SkIRect& srcRect,
                                   SkImage::RescaleGamma rescaleGamma,
                                   SkImage::RescaleMode rescaleMode,
                                   SkImage::ReadPixelsCallback callback,
                                   SkImage::ReadPixelsContext context);

    void asyncRescaleAndReadPixels(const SkSurface* surface,
                                   const SkImageInfo& dstImageInfo,
                                   const SkIRect& srcRect,
                                   SkImage::RescaleGamma rescaleGamma,
                                   SkImage::RescaleMode rescaleMode,
                                   SkImage::ReadPixelsCallback callback,
                                   SkImage::ReadPixelsContext context);

    void asyncRescaleAndReadPixelsYUV420(const SkImage*,
                                         SkYUVColorSpace yuvColorSpace,
                                         sk_sp<SkColorSpace> dstColorSpace,
                                         const SkIRect& srcRect,
                                         const SkISize& dstSize,
                                         SkImage::RescaleGamma rescaleGamma,
                                         SkImage::RescaleMode rescaleMode,
                                         SkImage::ReadPixelsCallback callback,
                                         SkImage::ReadPixelsContext context);

    void asyncRescaleAndReadPixelsYUV420(const SkSurface*,
                                         SkYUVColorSpace yuvColorSpace,
                                         sk_sp<SkColorSpace> dstColorSpace,
                                         const SkIRect& srcRect,
                                         const SkISize& dstSize,
                                         SkImage::RescaleGamma rescaleGamma,
                                         SkImage::RescaleMode rescaleMode,
                                         SkImage::ReadPixelsCallback callback,
                                         SkImage::ReadPixelsContext context);

    void asyncRescaleAndReadPixelsYUVA420(const SkImage*,
                                          SkYUVColorSpace yuvColorSpace,
                                          sk_sp<SkColorSpace> dstColorSpace,
                                          const SkIRect& srcRect,
                                          const SkISize& dstSize,
                                          SkImage::RescaleGamma rescaleGamma,
                                          SkImage::RescaleMode rescaleMode,
                                          SkImage::ReadPixelsCallback callback,
                                          SkImage::ReadPixelsContext context);

    void asyncRescaleAndReadPixelsYUVA420(const SkSurface*,
                                          SkYUVColorSpace yuvColorSpace,
                                          sk_sp<SkColorSpace> dstColorSpace,
                                          const SkIRect& srcRect,
                                          const SkISize& dstSize,
                                          SkImage::RescaleGamma rescaleGamma,
                                          SkImage::RescaleMode rescaleMode,
                                          SkImage::ReadPixelsCallback callback,
                                          SkImage::ReadPixelsContext context);

    /**
     * Checks whether any asynchronous work is complete and if so calls related callbacks.
     */
    void checkAsyncWorkCompletion();

    /**
     * Called to delete the passed in BackendTexture. This should only be called if the
     * BackendTexture was created by calling Recorder::createBackendTexture on a Recorder created
     * from this Context. If the BackendTexture is not valid or does not match the BackendApi of the
     * Context then nothing happens.
     *
     * Otherwise this will delete/release the backend object that is wrapped in the BackendTexture.
     * The BackendTexture will be reset to an invalid state and should not be used again.
     */
    void deleteBackendTexture(const BackendTexture&);

    /**
     * Frees GPU resources created and held by the Context. Can be called to reduce GPU memory
     * pressure. Any resources that are still in use (e.g. being used by work submitted to the GPU)
     * will not be deleted by this call. If the caller wants to make sure all resources are freed,
     * then they should first make sure to submit and wait on any outstanding work.
     */
    void freeGpuResources();

    /**
     * Purge GPU resources on the Context that haven't been used in the past 'msNotUsed'
     * milliseconds or are otherwise marked for deletion, regardless of whether the context is under
     * budget.
     */
    void performDeferredCleanup(std::chrono::milliseconds msNotUsed);

    // Provides access to functions that aren't part of the public API.
    ContextPriv priv();
    const ContextPriv priv() const;  // NOLINT(readability-const-return-type)

    class ContextID {
    public:
        static Context::ContextID Next();

        ContextID() : fID(SK_InvalidUniqueID) {}

        bool operator==(const ContextID& that) const { return fID == that.fID; }
        bool operator!=(const ContextID& that) const { return !(*this == that); }

        void makeInvalid() { fID = SK_InvalidUniqueID; }
        bool isValid() const { return fID != SK_InvalidUniqueID; }

    private:
        constexpr ContextID(uint32_t id) : fID(id) {}
        uint32_t fID;
    };

    ContextID contextID() const { return fContextID; }

protected:
    Context(sk_sp<SharedContext>, std::unique_ptr<QueueManager>, const ContextOptions&);

private:
    friend class ContextPriv;
    friend class ContextCtorAccessor;

    SingleOwner* singleOwner() const { return &fSingleOwner; }

    // Must be called in Make() to handle one-time GPU setup operations that can possibly fail and
    // require Context::Make() to return a nullptr.
    bool finishInitialization();

    void asyncRescaleAndReadPixelsYUV420Impl(const SkImage*,
                                             SkYUVColorSpace yuvColorSpace,
                                             bool readAlpha,
                                             sk_sp<SkColorSpace> dstColorSpace,
                                             const SkIRect& srcRect,
                                             const SkISize& dstSize,
                                             SkImage::RescaleGamma rescaleGamma,
                                             SkImage::RescaleMode rescaleMode,
                                             SkImage::ReadPixelsCallback callback,
                                             SkImage::ReadPixelsContext context);

    void asyncReadPixels(const TextureProxy* textureProxy,
                         const SkImageInfo& srcImageInfo,
                         const SkColorInfo& dstColorInfo,
                         const SkIRect& srcRect,
                         SkImage::ReadPixelsCallback callback,
                         SkImage::ReadPixelsContext context);

    void asyncReadPixelsYUV420(Recorder*,
                               const SkImage*,
                               SkYUVColorSpace yuvColorSpace,
                               bool readAlpha,
                               const SkIRect& srcRect,
                               SkImage::ReadPixelsCallback callback,
                               SkImage::ReadPixelsContext context);

    // Inserts a texture to buffer transfer task, used by asyncReadPixels methods
    struct PixelTransferResult {
        using ConversionFn = void(void* dst, const void* mappedBuffer);
        // If null then the transfer could not be performed. Otherwise this buffer will contain
        // the pixel data when the transfer is complete.
        sk_sp<Buffer> fTransferBuffer;
        // RowBytes for transfer buffer data
        size_t fRowBytes;
        // If this is null then the transfer buffer will contain the data in the requested
        // color type. Otherwise, when the transfer is done this must be called to convert
        // from the transfer buffer's color type to the requested color type.
        std::function<ConversionFn> fPixelConverter;
    };
    PixelTransferResult transferPixels(const TextureProxy*,
                                       const SkImageInfo& srcImageInfo,
                                       const SkColorInfo& dstColorInfo,
                                       const SkIRect& srcRect);

    sk_sp<SharedContext> fSharedContext;
    std::unique_ptr<ResourceProvider> fResourceProvider;
    std::unique_ptr<QueueManager> fQueueManager;
    std::unique_ptr<ClientMappedBufferManager> fMappedBufferManager;
    std::unique_ptr<PlotUploadTracker> fPlotUploadTracker;

    // In debug builds we guard against improper thread handling. This guard is passed to the
    // ResourceCache for the Context.
    mutable SingleOwner fSingleOwner;

#if defined(GRAPHITE_TEST_UTILS)
    // In test builds a Recorder may track the Context that was used to create it.
    bool fStoreContextRefInRecorder = false;
    // If this tracking is on, to allow the client to safely delete this Context or its Recorders
    // in any order we must also track the Recorders created here.
    std::vector<Recorder*> fTrackedRecorders;
#endif

    // Needed for MessageBox handling
    const ContextID fContextID;
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_Context_DEFINED
