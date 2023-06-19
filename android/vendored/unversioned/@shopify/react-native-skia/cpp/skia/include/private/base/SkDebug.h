/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkDebug_DEFINED
#define SkDebug_DEFINED

#include "include/private/base/SkAPI.h"
#include "include/private/base/SkAttributes.h"
#include "include/private/base/SkLoadUserConfig.h" // IWYU pragma: keep

#if !defined(SkDebugf)
    void SK_SPI SkDebugf(const char format[], ...) SK_PRINTF_LIKE(1, 2);
#endif

#if defined(SK_DEBUG)
    #define SkDEBUGCODE(...)  __VA_ARGS__
    #define SkDEBUGF(...)     SkDebugf(__VA_ARGS__)
#else
    #define SkDEBUGCODE(...)
    #define SkDEBUGF(...)
#endif

#endif
