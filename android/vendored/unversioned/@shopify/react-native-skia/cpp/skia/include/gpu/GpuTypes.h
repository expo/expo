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

    /**
     * Graphite doesn't support some context types (e.g. Direct3D) and will return Unsupported.
     */
    kUnsupported,
};

/** Indicates whether an allocation should count against a cache budget. */
enum class Budgeted : bool {
    kNo = false,
    kYes = true,
};

/**
 * Value passed into various callbacks to tell the client the result of operations connected to a
 * specific callback. The actual interpretation of kFailed and kSuccess are dependent on the
 * specific callbacks and are documented with the callback itself.
 */
enum class CallbackResult : bool {
    kFailed = false,
    kSuccess = true,
};

/**
 * Is the texture mipmapped or not
 */
enum class Mipmapped : bool {
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

/**
 * Is a texture renderable or not
 */
enum class Renderable : bool {
    kNo = false,
    kYes = true,
};

/**
 * What is the logical origin of a BackendTexture passed into Skia
 */
enum class Origin : unsigned {
    kTopLeft,
    kBottomLeft,
};

} // namespace skgpu


#endif // skgpu_GpuTypes_DEFINED
