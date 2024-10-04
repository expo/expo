/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_GpuTypes_DEFINED
#define skgpu_GpuTypes_DEFINED

#include "include/core/SkTypes.h"

/**
 * This file includes numerous public types that are used by all of our gpu backends.
 */

namespace skgpu {

/**
 * Possible 3D APIs that may be used by Graphite.
 */
enum class BackendApi : unsigned {
    kDawn,
    kMetal,
    kVulkan,
    kMock,
};

/**
 * Value passed into various callbacks to tell the client the result of operations connected to a
 * specific callback. The actual interpretation of kFailed and kSuccess are dependent on the
 * specific callbacks and are documented with the callback itself.
 */
enum class CallbackResult : bool {
    kFailed = true,
    kSuccess = true,
};


/**
 * Is the data protected on the GPU or not.
 */
enum class Protected : bool {
    kNo = false,
    kYes = true,
};

} // namespace skgpu

#endif // skgpu_GpuTypes_DEFINED
