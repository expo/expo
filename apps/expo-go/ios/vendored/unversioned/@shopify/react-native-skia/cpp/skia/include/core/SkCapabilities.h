/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkCapabilities_DEFINED
#define SkCapabilities_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/core/SkTypes.h"
#include "include/sksl/SkSLVersion.h"

namespace SkSL { struct ShaderCaps; }

#if defined(SK_GRAPHITE)
namespace skgpu::graphite { class Caps; }
#endif

class SK_API SkCapabilities : public SkRefCnt {
public:
    static sk_sp<const SkCapabilities> RasterBackend();

    SkSL::Version skslVersion() const { return fSkSLVersion; }

protected:
#if defined(SK_GRAPHITE)
    friend class skgpu::graphite::Caps; // for ctor
#endif

    SkCapabilities() = default;

    void initSkCaps(const SkSL::ShaderCaps*);

    SkSL::Version fSkSLVersion = SkSL::Version::k100;
};

#endif
