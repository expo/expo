/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_MtlGraphiteUtils_DEFINED
#define skgpu_graphite_MtlGraphiteUtils_DEFINED

#include <memory>

#include "include/private/base/SkAPI.h"

namespace skgpu::graphite {

class Context;
struct ContextOptions;
struct MtlBackendContext;

namespace ContextFactory {
SK_API std::unique_ptr<Context> MakeMetal(const MtlBackendContext&, const ContextOptions&);
} // namespace ContextFactory

} // namespace skgpu::graphite

#endif // skgpu_graphite_MtlGraphiteUtils_DEFINED
