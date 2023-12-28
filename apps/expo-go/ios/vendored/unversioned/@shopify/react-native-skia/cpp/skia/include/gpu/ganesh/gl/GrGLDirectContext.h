/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef GrGLDirectContext_DEFINED
#define GrGLDirectContext_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

class GrDirectContext;
struct GrContextOptions;
struct GrGLInterface;

namespace GrDirectContexts {
/**
 * Creates a GrDirectContext for a backend context. If no GrGLInterface is provided then the
 * result of GrGLMakeNativeInterface() is used if it succeeds.
 */
SK_API sk_sp<GrDirectContext> MakeGL(sk_sp<const GrGLInterface>, const GrContextOptions&);
SK_API sk_sp<GrDirectContext> MakeGL(sk_sp<const GrGLInterface>);
SK_API sk_sp<GrDirectContext> MakeGL(const GrContextOptions&);
SK_API sk_sp<GrDirectContext> MakeGL();
}

#endif
