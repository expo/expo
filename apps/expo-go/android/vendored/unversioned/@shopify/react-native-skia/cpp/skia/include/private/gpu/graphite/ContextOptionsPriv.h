/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_graphite_ContextOptionsPriv_DEFINED
#define skgpu_graphite_ContextOptionsPriv_DEFINED

namespace skgpu::graphite {

/**
 * Private options that are only meant for testing within Skia's tools.
 */
struct ContextOptionsPriv {

    int  fMaxTextureSizeOverride = SK_MaxS32;

    /**
     * Maximum width and height of internal texture atlases.
     */
    int  fMaxTextureAtlasSize = 2048;

    /**
     * If true, will store a pointer in Recorder that points back to the Context
     * that created it. Used by readPixels() and other methods that normally require a Context.
     */
    bool fStoreContextRefInRecorder = false;
};

}  // namespace skgpu::graphite

#endif  // skgpu_graphite_ContextOptionsPriv_DEFINED
