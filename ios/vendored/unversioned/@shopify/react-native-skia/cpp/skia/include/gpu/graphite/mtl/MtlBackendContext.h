/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_MtlBackendContext_DEFINED
#define skgpu_graphite_MtlBackendContext_DEFINED

#include "include/gpu/graphite/mtl/MtlTypes.h"

namespace skgpu::graphite {

// The MtlBackendContext contains all of the base Metal objects needed by the graphite Metal
// backend. The client will create this object and pass it into the Context::MakeMetal factory call
// when setting up Skia.
struct SK_API MtlBackendContext {
    sk_cfp<CFTypeRef> fDevice;
    sk_cfp<CFTypeRef> fQueue;
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_MtlBackendContext_DEFINED
