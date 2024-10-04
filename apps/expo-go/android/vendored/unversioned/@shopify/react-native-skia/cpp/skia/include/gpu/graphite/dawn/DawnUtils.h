/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_DawnUtils_DEFINED
#define skgpu_graphite_DawnUtils_DEFINED

#include <memory>

#include "include/private/base/SkAPI.h"

namespace skgpu::graphite {

class Context;
struct ContextOptions;
struct DawnBackendContext;

namespace ContextFactory {
SK_API std::unique_ptr<Context> MakeDawn(const DawnBackendContext&, const ContextOptions&);
} // namespace ContextFactory

} // namespace skgpu::graphite


#endif // skgpu_graphite_DawnUtils_DEFINED
