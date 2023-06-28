/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SK_USER_CONFIG_WAS_LOADED

// Include this to set reasonable defaults (e.g. for SK_CPU_LENDIAN)
#include "include/private/base/SkFeatures.h"

// Allows embedders that want to disable macros that take arguments to just
// define that symbol to be one of these
#define SK_NOTHING_ARG1(arg1)
#define SK_NOTHING_ARG2(arg1, arg2)
#define SK_NOTHING_ARG3(arg1, arg2, arg3)

// IWYU pragma: begin_exports

// Note: SK_USER_CONFIG_HEADER will not work with Bazel builds and some C++ compilers.
#if defined(SK_USER_CONFIG_HEADER)
    #include SK_USER_CONFIG_HEADER
#elif defined(SK_USE_BAZEL_CONFIG_HEADER)
    // The Bazel config file is presumed to be in the root directory of its Bazel Workspace.
    // This is achieved in Skia by having a nested WORKSPACE in include/config and a cc_library
    // defined in that folder. As a result, we do not try to include SkUserConfig.h from the
    // top of Skia because Bazel sandboxing will move it to a different location.
    #include "SkUserConfig.h"
#else
    #include "include/config/SkUserConfig.h"
#endif
// IWYU pragma: end_exports

// Checks to make sure the SkUserConfig options do not conflict.
#if !defined(SK_DEBUG) && !defined(SK_RELEASE)
    #ifdef NDEBUG
        #define SK_RELEASE
    #else
        #define SK_DEBUG
    #endif
#endif

#if defined(SK_DEBUG) && defined(SK_RELEASE)
#  error "cannot define both SK_DEBUG and SK_RELEASE"
#elif !defined(SK_DEBUG) && !defined(SK_RELEASE)
#  error "must define either SK_DEBUG or SK_RELEASE"
#endif

#if defined(SK_CPU_LENDIAN) && defined(SK_CPU_BENDIAN)
#  error "cannot define both SK_CPU_LENDIAN and SK_CPU_BENDIAN"
#elif !defined(SK_CPU_LENDIAN) && !defined(SK_CPU_BENDIAN)
#  error "must define either SK_CPU_LENDIAN or SK_CPU_BENDIAN"
#endif

#if defined(SK_CPU_BENDIAN) && !defined(I_ACKNOWLEDGE_SKIA_DOES_NOT_SUPPORT_BIG_ENDIAN)
    #error "The Skia team is not endian-savvy enough to support big-endian CPUs."
    #error "If you still want to use Skia,"
    #error "please define I_ACKNOWLEDGE_SKIA_DOES_NOT_SUPPORT_BIG_ENDIAN."
#endif

#define SK_USER_CONFIG_WAS_LOADED
#endif // SK_USER_CONFIG_WAS_LOADED
