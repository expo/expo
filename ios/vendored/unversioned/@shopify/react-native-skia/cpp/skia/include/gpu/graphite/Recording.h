/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_Recording_DEFINED
#define skgpu_graphite_Recording_DEFINED

#include "include/core/SkRefCnt.h"

class SkTextureDataBlock;

namespace skgpu::graphite {

class CommandBuffer;
template<typename StorageT, typename BaseT> class PipelineDataCache;
using TextureDataCache = PipelineDataCache<std::unique_ptr<SkTextureDataBlock>, SkTextureDataBlock>;

class Recording final {
public:
    ~Recording();

protected:
private:
    friend class Context; // for access fCommandBuffer
    friend class Recorder; // for ctor
    Recording(sk_sp<CommandBuffer>, std::unique_ptr<TextureDataCache>);

    sk_sp<CommandBuffer> fCommandBuffer;

    // The TextureDataCache holds all the Textures and Samplers used in this Recording.
    std::unique_ptr<TextureDataCache> fTextureDataCache;
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_Recording_DEFINED
