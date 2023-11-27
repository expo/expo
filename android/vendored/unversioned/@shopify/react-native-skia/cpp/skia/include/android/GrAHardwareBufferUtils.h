/*
 * Copyright 2019 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef GrAHardwareBufferUtils_DEFINED
#define GrAHardwareBufferUtils_DEFINED

#include "include/core/SkTypes.h"

#if defined(SK_BUILD_FOR_ANDROID) && __ANDROID_API__ >= 26

#include "include/gpu/GrBackendSurface.h"
#include "include/gpu/GrTypes.h"

class GrDirectContext;

extern "C" {
    typedef struct AHardwareBuffer AHardwareBuffer;
}

namespace GrAHardwareBufferUtils {

SkColorType GetSkColorTypeFromBufferFormat(uint32_t bufferFormat);

#if !defined(SK_DISABLE_LEGACY_ANDROID_HW_UTILS)
GrBackendFormat GetBackendFormat(GrDirectContext* dContext, AHardwareBuffer* hardwareBuffer,
                                 uint32_t bufferFormat, bool requireKnownFormat);
#endif

GrBackendFormat GetGLBackendFormat(GrDirectContext* dContext, uint32_t bufferFormat,
                                   bool requireKnownFormat);
GrBackendFormat GetVulkanBackendFormat(GrDirectContext* dContext, AHardwareBuffer* hardwareBuffer,
                                       uint32_t bufferFormat, bool requireKnownFormat);

typedef void* TexImageCtx;
typedef void (*DeleteImageProc)(TexImageCtx);
typedef void (*UpdateImageProc)(TexImageCtx, GrDirectContext*);

/**
 * Create a GrBackendTexture from AHardwareBuffer
 *
 * @param   context         GPU context
 * @param   hardwareBuffer  AHB
 * @param   width           texture width
 * @param   height          texture height
 * @param   deleteProc      returns a function that deletes the texture and
 *                          other GPU resources. Must be invoked on the same
 *                          thread as MakeBackendTexture
 * @param   updateProc      returns a function, that needs to be invoked, when
 *                          AHB buffer content has changed. Must be invoked on
 *                          the same thread as MakeBackendTexture
 * @param   imageCtx        returns an opaque image context, that is passed as
 *                          first argument to deleteProc and updateProc
 * @param   isProtectedContent if true, GL backend uses EXT_protected_content
 * @param   backendFormat   backend format, usually created with helper
 *                          function GetBackendFormat
 * @param   isRenderable    true if GrBackendTexture can be used as a color
 *                          attachment
 * @return                  valid GrBackendTexture object on success
 */
#if !defined(SK_DISABLE_LEGACY_ANDROID_HW_UTILS)
GrBackendTexture MakeBackendTexture(GrDirectContext* dContext, AHardwareBuffer* hardwareBuffer,
                                    int width, int height,
                                    DeleteImageProc* deleteProc,
                                    UpdateImageProc* updateProc,
                                    TexImageCtx* imageCtx,
                                    bool isProtectedContent,
                                    const GrBackendFormat& backendFormat,
                                    bool isRenderable,
                                    bool fromAndroidWindow = false);
#endif

GrBackendTexture MakeGLBackendTexture(GrDirectContext* dContext,
                                      AHardwareBuffer* hardwareBuffer,
                                      int width, int height,
                                      DeleteImageProc* deleteProc,
                                      UpdateImageProc* updateProc,
                                      TexImageCtx* imageCtx,
                                      bool isProtectedContent,
                                      const GrBackendFormat& backendFormat,
                                      bool isRenderable);

GrBackendTexture MakeVulkanBackendTexture(GrDirectContext* dContext,
                                          AHardwareBuffer* hardwareBuffer,
                                          int width, int height,
                                          DeleteImageProc* deleteProc,
                                          UpdateImageProc* updateProc,
                                          TexImageCtx* imageCtx,
                                          bool isProtectedContent,
                                          const GrBackendFormat& backendFormat,
                                          bool isRenderable,
                                          bool fromAndroidWindow = false);

}  // namespace GrAHardwareBufferUtils

#endif
#endif
