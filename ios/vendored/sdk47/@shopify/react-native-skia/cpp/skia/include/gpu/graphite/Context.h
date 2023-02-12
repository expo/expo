/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_Context_DEFINED
#define skgpu_graphite_Context_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkShader.h"
#include "include/gpu/graphite/ContextOptions.h"
#include "include/gpu/graphite/GraphiteTypes.h"
#include "include/gpu/graphite/Recorder.h"
#include "include/private/SingleOwner.h"

#include <memory>

class SkRuntimeEffect;

namespace skgpu { struct VulkanBackendContext; }

namespace skgpu::graphite {

class BackendTexture;
class Context;
class ContextPriv;
struct DawnBackendContext;
class GlobalCache;
struct MtlBackendContext;
class QueueManager;
class Recording;
class ResourceProvider;
class SharedContext;

#ifdef SK_ENABLE_PRECOMPILE
class BlenderID;
class CombinationBuilder;
#endif

class SK_API Context final {
public:
    Context(const Context&) = delete;
    Context(Context&&) = delete;
    Context& operator=(const Context&) = delete;
    Context& operator=(Context&&) = delete;

    ~Context();

#ifdef SK_DAWN
    static std::unique_ptr<Context> MakeDawn(const DawnBackendContext&, const ContextOptions&);
#endif
#ifdef SK_METAL
    static std::unique_ptr<Context> MakeMetal(const MtlBackendContext&, const ContextOptions&);
#endif

#ifdef SK_VULKAN
    static std::unique_ptr<Context> MakeVulkan(const VulkanBackendContext&, const ContextOptions&);
#endif

    BackendApi backend() const;

    std::unique_ptr<Recorder> makeRecorder(const RecorderOptions& = {});

    void insertRecording(const InsertRecordingInfo&);
    void submit(SyncToCpu = SyncToCpu::kNo);

    /**
     * Checks whether any asynchronous work is complete and if so calls related callbacks.
     */
    void checkAsyncWorkCompletion();

#ifdef SK_ENABLE_PRECOMPILE
    // TODO: add "ShaderID addUserDefinedShader(sk_sp<SkRuntimeEffect>)" here
    // TODO: add "ColorFilterID addUserDefinedColorFilter(sk_sp<SkRuntimeEffect>)" here
    BlenderID addUserDefinedBlender(sk_sp<SkRuntimeEffect>);

    void precompile(CombinationBuilder*);
#endif

    /**
     * Called to delete the passed in BackendTexture. This should only be called if the
     * BackendTexture was created by calling Recorder::createBackendTexture on a Recorder created
     * from this Context. If the BackendTexture is not valid or does not match the BackendApi of the
     * Context then nothing happens.
     *
     * Otherwise this will delete/release the backend object that is wrapped in the BackendTexture.
     * The BackendTexture will be reset to an invalid state and should not be used again.
     */
    void deleteBackendTexture(BackendTexture&);

    // Provides access to functions that aren't part of the public API.
    ContextPriv priv();
    const ContextPriv priv() const;  // NOLINT(readability-const-return-type)

protected:
    Context(sk_sp<SharedContext>, std::unique_ptr<QueueManager>);

private:
    friend class ContextPriv;

    SingleOwner* singleOwner() const { return &fSingleOwner; }

    sk_sp<SharedContext> fSharedContext;
    std::unique_ptr<ResourceProvider> fResourceProvider;
    std::unique_ptr<QueueManager> fQueueManager;

    // In debug builds we guard against improper thread handling. This guard is passed to the
    // ResourceCache for the Context.
    mutable SingleOwner fSingleOwner;
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_Context_DEFINED
