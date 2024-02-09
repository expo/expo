/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkAPI_DEFINED
#define SkAPI_DEFINED

#include "include/private/base/SkLoadUserConfig.h" // IWYU pragma: keep

// If SKIA_IMPLEMENTATION is defined as 1, that signals we are building Skia and should
// export our symbols. If it is not set (or set to 0), then Skia is being used by a client
// and we should not export our symbols.
#if !defined(SKIA_IMPLEMENTATION)
    #define SKIA_IMPLEMENTATION 0
#endif

// If we are compiling Skia is being as a DLL, we need to be sure to export all of our public
// APIs to that DLL. If a client is using Skia which was compiled as a DLL, we need to instruct
// the linker to use the symbols from that DLL. This is the goal of the SK_API define.
#if !defined(SK_API)
    #if defined(SKIA_DLL)
        #if defined(_MSC_VER)
            #if SKIA_IMPLEMENTATION
                #define SK_API __declspec(dllexport)
            #else
                #define SK_API __declspec(dllimport)
            #endif
        #else
            #define SK_API __attribute__((visibility("default")))
        #endif
    #else
        #define SK_API
    #endif
#endif

// SK_SPI is functionally identical to SK_API, but used within src to clarify that it's less stable
#if !defined(SK_SPI)
    #define SK_SPI SK_API
#endif

// See https://clang.llvm.org/docs/AttributeReference.html#availability
// The API_AVAILABLE macro comes from <os/availability.h> on MacOS
#if defined(SK_ENABLE_API_AVAILABLE)
#   define SK_API_AVAILABLE API_AVAILABLE
#else
#   define SK_API_AVAILABLE(...)
#endif

#endif
