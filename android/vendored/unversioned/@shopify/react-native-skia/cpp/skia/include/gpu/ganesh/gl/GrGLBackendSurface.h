/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrGLBackendSurface_DEFINED
#define GrGLBackendSurface_DEFINED

#include "include/gpu/gl/GrGLTypes.h"
#include "include/private/base/SkAPI.h"

#include <string_view>

class GrBackendFormat;
class GrBackendTexture;
class GrBackendRenderTarget;

namespace skgpu { enum class Mipmapped : bool; }

namespace GrBackendFormats {
SK_API GrBackendFormat MakeGL(GrGLenum format, GrGLenum target);

SK_API GrGLFormat AsGLFormat(const GrBackendFormat&);
SK_API GrGLenum AsGLFormatEnum(const GrBackendFormat&);
}  // namespace GrBackendFormats

namespace GrBackendTextures {
// The GrGLTextureInfo must have a valid fFormat.
SK_API GrBackendTexture MakeGL(int width,
                               int height,
                               skgpu::Mipmapped,
                               const GrGLTextureInfo& glInfo,
                               std::string_view label = {});

// If the backend API is GL, copies a snapshot of the GrGLTextureInfo struct into the passed in
// pointer and returns true. Otherwise returns false if the backend API is not GL.
SK_API bool GetGLTextureInfo(const GrBackendTexture&, GrGLTextureInfo*);

// Call this to indicate that the texture parameters have been modified in the GL context
// externally to GrContext.
SK_API void GLTextureParametersModified(GrBackendTexture*);
}  // namespace GrBackendTextures

namespace GrBackendRenderTargets {
// The GrGLTextureInfo must have a valid fFormat. If wrapping in an SkSurface we require the
// stencil bits to be either 0, 8 or 16.
SK_API GrBackendRenderTarget MakeGL(int width,
                                    int height,
                                    int sampleCnt,
                                    int stencilBits,
                                    const GrGLFramebufferInfo& glInfo);

SK_API bool GetGLFramebufferInfo(const GrBackendRenderTarget&, GrGLFramebufferInfo*);
}  // namespace GrBackendRenderTargets

#endif
