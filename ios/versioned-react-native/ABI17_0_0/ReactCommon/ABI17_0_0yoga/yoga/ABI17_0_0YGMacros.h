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
#define ABI17_0_0YG_EXTERN_C_BEGIN extern "C" {
#define ABI17_0_0YG_EXTERN_C_END }
#else
#define ABI17_0_0YG_EXTERN_C_BEGIN
#define ABI17_0_0YG_EXTERN_C_END
#endif

#ifdef _WINDLL
#define WIN_EXPORT __declspec(dllexport)
#else
#define WIN_EXPORT
#endif

#ifdef WINARMDLL
#define WIN_STRUCT(type) type*
#define WIN_STRUCT_REF(value) &value
#else
#define WIN_STRUCT(type) type
#define WIN_STRUCT_REF(value) value
#endif

#ifndef FB_ASSERTIONS_ENABLED
#define FB_ASSERTIONS_ENABLED 1
#endif

#if FB_ASSERTIONS_ENABLED
#define ABI17_0_0YG_ABORT() abort()
#else
#define ABI17_0_0YG_ABORT()
#endif

#ifndef ABI17_0_0YG_ASSERT
#define ABI17_0_0YG_ASSERT(X, message)              \
  if (!(X)) {                              \
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelError, "%s", message); \
    ABI17_0_0YG_ABORT();                            \
  }
#endif

#ifdef NS_ENUM
// Cannot use NSInteger as NSInteger has a different size than int (which is the default type of a
// enum).
// Therefor when linking the Yoga C library into obj-c the header is a missmatch for the Yoga ABI.
#define ABI17_0_0YG_ENUM_BEGIN(name) NS_ENUM(int, name)
#define ABI17_0_0YG_ENUM_END(name)
#else
#define ABI17_0_0YG_ENUM_BEGIN(name) enum name
#define ABI17_0_0YG_ENUM_END(name) name
#endif
