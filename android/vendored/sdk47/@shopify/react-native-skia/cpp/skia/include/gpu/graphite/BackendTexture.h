/*
 * Copyright 2021 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_BackendTexture_DEFINED
#define skgpu_graphite_BackendTexture_DEFINED

#include "include/core/SkSize.h"
#include "include/gpu/graphite/GraphiteTypes.h"
#include "include/gpu/graphite/TextureInfo.h"

#ifdef SK_METAL
#include "include/gpu/graphite/mtl/MtlTypes.h"
#endif

namespace skgpu::graphite {

class BackendTexture {
public:
    BackendTexture() {}
#ifdef SK_METAL
    // The BackendTexture will not call retain or release on the passed in MtlHandle. Thus the
    // client must keep the MtlHandle valid until they are no longer using the BackendTexture.
    BackendTexture(SkISize dimensions, MtlHandle mtlTexture);
#endif

    BackendTexture(const BackendTexture&);

    ~BackendTexture();

    BackendTexture& operator=(const BackendTexture&);

    bool operator==(const BackendTexture&) const;
    bool operator!=(const BackendTexture& that) const { return !(*this == that); }

    bool isValid() const { return fInfo.isValid(); }
    BackendApi backend() const { return fInfo.backend(); }

    SkISize dimensions() const { return fDimensions; }

    const TextureInfo& info() const { return fInfo; }

#ifdef SK_METAL
    MtlHandle getMtlTexture() const;
#endif

private:
    SkISize fDimensions;
    TextureInfo fInfo;

    union {
#ifdef SK_METAL
        MtlHandle fMtlTexture;
#endif
    };
};

} // namespace skgpu::graphite

#endif // skgpu_graphite_BackendTexture_DEFINED

