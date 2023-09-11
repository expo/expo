/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_Recording_DEFINED
#define skgpu_graphite_Recording_DEFINED

#include "include/core/SkRefCnt.h"

#include <memory>
#include <vector>

namespace skgpu::graphite {

class CommandBuffer;
class RecordingPriv;
class Resource;
class ResourceProvider;
class TaskGraph;

class Recording final {
public:
    ~Recording();

    RecordingPriv priv();

private:
    friend class Recorder; // for ctor
    friend class RecordingPriv;

    Recording(std::unique_ptr<TaskGraph>);

    bool addCommands(CommandBuffer*, ResourceProvider*);
    void addResourceRef(sk_sp<Resource>);

    std::unique_ptr<TaskGraph> fGraph;
    // We don't always take refs to all resources used by specific Tasks (e.g. a common buffer used
    // for uploads). Instead we'll just hold onto one ref for those Resources outside the Tasks.
    // Those refs are stored in the array here and will eventually be passed onto a CommandBuffer
    // when the Recording adds its commands.
    std::vector<sk_sp<Resource>> fExtraResourceRefs;
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_Recording_DEFINED
