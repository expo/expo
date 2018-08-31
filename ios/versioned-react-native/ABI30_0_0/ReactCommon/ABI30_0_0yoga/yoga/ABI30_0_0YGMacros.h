/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus
#define ABI30_0_0YG_EXTERN_C_BEGIN extern "C" {
#define ABI30_0_0YG_EXTERN_C_END }
#else
#define ABI30_0_0YG_EXTERN_C_BEGIN
#define ABI30_0_0YG_EXTERN_C_END
#endif

#ifdef _WINDLL
#define WIN_EXPORT __declspec(dllexport)
#else
#define WIN_EXPORT
#endif

#ifdef WINARMDLL
#define WIN_STRUCT(type) type *
#define WIN_STRUCT_REF(value) &value
#else
#define WIN_STRUCT(type) type
#define WIN_STRUCT_REF(value) value
#endif

#ifdef NS_ENUM
// Cannot use NSInteger as NSInteger has a different size than int (which is the default type of a
// enum).
// Therefor when linking the Yoga C library into obj-c the header is a missmatch for the Yoga ABI.
#define ABI30_0_0YG_ENUM_BEGIN(name) NS_ENUM(int, name)
#define ABI30_0_0YG_ENUM_END(name)
#else
#define ABI30_0_0YG_ENUM_BEGIN(name) enum name
#define ABI30_0_0YG_ENUM_END(name) name
#endif
