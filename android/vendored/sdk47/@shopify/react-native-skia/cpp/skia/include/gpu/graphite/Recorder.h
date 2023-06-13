/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_Recorder_DEFINED
#define skgpu_graphite_Recorder_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/private/SingleOwner.h"

#include <vector>

class SkTextureDataBlock;
class SkUniformDataBlock;
class SkUniformDataBlockPassThrough;  // TODO: remove

namespace skgpu::graphite {

class Caps;
class Device;
class DrawBufferManager;
class GlobalCache;
class Gpu;
class RecorderPriv;
class Recording;
class ResourceProvider;
class Task;
class TaskGraph;
class UploadBufferManager;

template<typename StorageT, typename BaseT> class PipelineDataCache;
using UniformDataCache = PipelineDataCache<SkUniformDataBlockPassThrough, SkUniformDataBlock>;
using TextureDataCache = PipelineDataCache<std::unique_ptr<SkTextureDataBlock>, SkTextureDataBlock>;

class Recorder final {
public:
    Recorder(const Recorder&) = delete;
    Recorder(Recorder&&) = delete;
    Recorder& operator=(const Recorder&) = delete;
    Recorder& operator=(Recorder&&) = delete;

    ~Recorder();

    std::unique_ptr<Recording> snap();

    // Provides access to functions that aren't part of the public API.
    RecorderPriv priv();
    const RecorderPriv priv() const;  // NOLINT(readability-const-return-type)

#if GR_TEST_UTILS
    bool deviceIsRegistered(Device*);
#endif

private:
    friend class Context; // For ctor
    friend class Device; // For registering and deregistering Devices;
    friend class RecorderPriv; // for ctor and hidden methods

    Recorder(sk_sp<Gpu>, sk_sp<GlobalCache>);

    SingleOwner* singleOwner() const { return &fSingleOwner; }

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

    sk_sp<Gpu> fGpu;
    std::unique_ptr<ResourceProvider> fResourceProvider;

    std::unique_ptr<TaskGraph> fGraph;
    std::unique_ptr<UniformDataCache> fUniformDataCache;
    std::unique_ptr<TextureDataCache> fTextureDataCache;
    std::unique_ptr<DrawBufferManager> fDrawBufferManager;
    std::unique_ptr<UploadBufferManager> fUploadBufferManager;
    std::vector<Device*> fTrackedDevices;

    // In debug builds we guard against improper thread handling
    // This guard is passed to the ResourceCache.
    // TODO: Should we also pass this to Device, DrawContext, and similar classes?
    mutable SingleOwner fSingleOwner;
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_Recorder_DEFINED
