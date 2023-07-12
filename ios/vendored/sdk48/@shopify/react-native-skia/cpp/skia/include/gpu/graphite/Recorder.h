/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_Recorder_DEFINED
#define skgpu_graphite_Recorder_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkSize.h"
#include "include/gpu/graphite/GraphiteTypes.h"
#include "include/gpu/graphite/Recording.h"
#include "include/private/base/SingleOwner.h"
#include "include/private/base/SkTArray.h"

#include <vector>

class SkCanvas;
struct SkImageInfo;
class SkPixmap;

namespace skgpu {
class RefCntedCallback;
class TokenTracker;
}

namespace sktext::gpu {
class StrikeCache;
class TextBlobRedrawCoordinator;
}

namespace skgpu::graphite {

class AtlasManager;
class BackendTexture;
class Caps;
class Context;
class Device;
class DrawBufferManager;
class GlobalCache;
class ImageProvider;
class ProxyCache;
class RecorderPriv;
class ResourceProvider;
class RuntimeEffectDictionary;
class SharedContext;
class Task;
class TaskGraph;
class TextureDataBlock;
class TextureInfo;
class UniformDataBlock;
class UploadBufferManager;

template<typename T> class PipelineDataCache;
using UniformDataCache = PipelineDataCache<UniformDataBlock>;
using TextureDataCache = PipelineDataCache<TextureDataBlock>;

struct SK_API RecorderOptions final {
    RecorderOptions();
    RecorderOptions(const RecorderOptions&);
    ~RecorderOptions();

    sk_sp<ImageProvider> fImageProvider;
};

class SK_API Recorder final {
public:
    Recorder(const Recorder&) = delete;
    Recorder(Recorder&&) = delete;
    Recorder& operator=(const Recorder&) = delete;
    Recorder& operator=(Recorder&&) = delete;

    ~Recorder();

    std::unique_ptr<Recording> snap();

    ImageProvider* clientImageProvider() { return fClientImageProvider.get(); }
    const ImageProvider* clientImageProvider() const { return fClientImageProvider.get(); }

    /**
     * Creates a new backend gpu texture matching the dimensions and TextureInfo. If an invalid
     * TextureInfo or a TextureInfo Skia can't support is passed in, this will return an invalid
     * BackendTexture. Thus the client should check isValid on the returned BackendTexture to know
     * if it succeeded or not.
     *
     * If this does return a valid BackendTexture, the caller is required to use
     * Recorder::deleteBackendTexture or Context::deleteBackendTexture to delete the texture. It is
     * safe to use the Context that created this Recorder or any other Recorder created from the
     * same Context to call deleteBackendTexture.
     */
    BackendTexture createBackendTexture(SkISize dimensions, const TextureInfo&);

    /**
     * If possible, updates a backend texture with the provided pixmap data. The client
     * should check the return value to see if the update was successful. The client is required
     * to insert a Recording into the Context and call `submit` to send the upload work to the gpu.
     * The backend texture must be compatible with the provided pixmap(s). Compatible, in this case,
     * means that the backend format is compatible with the base pixmap's colortype. The src data
     * can be deleted when this call returns.
     * If the backend texture is mip mapped, the data for all the mipmap levels must be provided.
     * In the mipmapped case all the colortypes of the provided pixmaps must be the same.
     * Additionally, all the miplevels must be sized correctly (please see
     * SkMipmap::ComputeLevelSize and ComputeLevelCount).
     * Note: the pixmap's alphatypes and colorspaces are ignored.
     * For the Vulkan backend after a successful update the layout of the created VkImage will be:
     *      VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL
     */
    bool updateBackendTexture(const BackendTexture&,
                              const SkPixmap srcData[],
                              int numLevels);

    /**
     * Called to delete the passed in BackendTexture. This should only be called if the
     * BackendTexture was created by calling Recorder::createBackendTexture on a Recorder that is
     * associated with the same Context. If the BackendTexture is not valid or does not match the
     * BackendApi of the Recorder then nothing happens.
     *
     * Otherwise this will delete/release the backend object that is wrapped in the BackendTexture.
     * The BackendTexture will be reset to an invalid state and should not be used again.
     */
    void deleteBackendTexture(BackendTexture&);

    // Adds a proc that will be moved to the Recording upon snap, subsequently attached to the
    // CommandBuffer when the Recording is added, and called when that CommandBuffer is submitted
    // and finishes. If the Recorder or Recording is deleted before the proc is added to the
    // CommandBuffer, it will be called with result Failure.
    void addFinishInfo(const InsertFinishInfo&);

    // Returns a canvas that will record to a proxy surface, which must be instantiated on replay.
    // This can only be called once per Recording; subsequent calls will return null until a
    // Recording is snapped. Additionally, the returned SkCanvas is only valid until the next
    // Recording snap, at which point it is deleted.
    SkCanvas* makeDeferredCanvas(const SkImageInfo&, const TextureInfo&);

    // Provides access to functions that aren't part of the public API.
    RecorderPriv priv();
    const RecorderPriv priv() const;  // NOLINT(readability-const-return-type)

#if GRAPHITE_TEST_UTILS
    bool deviceIsRegistered(Device*);
#endif

private:
    friend class Context; // For ctor
    friend class Device; // For registering and deregistering Devices;
    friend class RecorderPriv; // for ctor and hidden methods

    Recorder(sk_sp<SharedContext>, const RecorderOptions&);

    SingleOwner* singleOwner() const { return &fSingleOwner; }

    BackendApi backend() const;

    // We keep track of all Devices that are connected to a Recorder. This allows the client to
    // safely delete an SkSurface or a Recorder in any order. If the client deletes the Recorder
    // we need to notify all Devices that the Recorder is no longer valid. If we delete the
    // SkSurface/Device first we will flush all the Device's into the Recorder before deregistering
    // it from the Recorder.
    //
    // We do not need to take a ref on the Device since the Device will flush and deregister itself
    // in its dtor. There is no other need for the Recorder to know about the Device after this
    // point.
    //
    // Note: We could probably get by with only registering Devices directly connected to
    // SkSurfaces. All other one off Devices will be created in a controlled scope where the
    // Recorder should still be valid by the time they need to flush their work when the Device is
    // deleted. We would have to make sure we safely handle cases where a client calls saveLayer
    // then either deletes the SkSurface or Recorder before calling restore. For simplicity we just
    // register every device for now, but if we see extra overhead in pushing back the extra
    // pointers, we can look into only registering SkSurface Devices.
    void registerDevice(Device*);
    void deregisterDevice(const Device*);

    sk_sp<SharedContext> fSharedContext;
    std::unique_ptr<ResourceProvider> fResourceProvider;
    std::unique_ptr<RuntimeEffectDictionary> fRuntimeEffectDict;

    std::unique_ptr<TaskGraph> fGraph;
    std::unique_ptr<UniformDataCache> fUniformDataCache;
    std::unique_ptr<TextureDataCache> fTextureDataCache;
    std::unique_ptr<DrawBufferManager> fDrawBufferManager;
    std::unique_ptr<UploadBufferManager> fUploadBufferManager;
    std::vector<Device*> fTrackedDevices;

    uint32_t fRecorderID;  // Needed for MessageBox handling for text
    std::unique_ptr<AtlasManager> fAtlasManager;
    std::unique_ptr<TokenTracker> fTokenTracker;
    std::unique_ptr<sktext::gpu::StrikeCache> fStrikeCache;
    std::unique_ptr<sktext::gpu::TextBlobRedrawCoordinator> fTextBlobCache;
    sk_sp<ImageProvider> fClientImageProvider;

    // In debug builds we guard against improper thread handling
    // This guard is passed to the ResourceCache.
    // TODO: Should we also pass this to Device, DrawContext, and similar classes?
    mutable SingleOwner fSingleOwner;

    sk_sp<Device> fTargetProxyDevice;
    std::unique_ptr<SkCanvas> fTargetProxyCanvas;
    std::unique_ptr<Recording::LazyProxyData> fTargetProxyData;

    skia_private::TArray<sk_sp<RefCntedCallback>> fFinishedProcs;

#if GRAPHITE_TEST_UTILS
    // For testing use only -- the Context used to create this Recorder
    Context* fContext = nullptr;
#endif
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_Recorder_DEFINED
