/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#ifdef __cplusplus
#define ABI12_0_0CSS_EXTERN_C_BEGIN extern "C" {
#define ABI12_0_0CSS_EXTERN_C_END }
#else
#define ABI12_0_0CSS_EXTERN_C_BEGIN
#define ABI12_0_0CSS_EXTERN_C_END
#endif

#ifdef _WINDLL
#define WIN_EXPORT __declspec(dllexport)
#else
#define WIN_EXPORT
#endif

#ifndef FB_ASSERTIONS_ENABLED
#define FB_ASSERTIONS_ENABLED 1
#endif

#if FB_ASSERTIONS_ENABLED
#define ABI12_0_0CSS_ABORT() abort()
#else
#define ABI12_0_0CSS_ABORT()
#endif

#if ABI12_0_0CSS_ASSERT_FAIL_ENABLED
#define ABI12_0_0CSS_ERROR_FUNC(message) ABI12_0_0CSSAssertFail(message)
#else
#define ABI12_0_0CSS_ERROR_FUNC(message) fprintf(stderr, "%s", message)
#endif

#ifndef ABI12_0_0CSS_ASSERT
#define ABI12_0_0CSS_ASSERT(X, message) \
  if (!(X)) {                  \
    ABI12_0_0CSS_ERROR_FUNC(message);   \
    ABI12_0_0CSS_ABORT();               \
  }
#endif
