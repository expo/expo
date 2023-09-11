/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus
#define ABI47_0_0YG_EXTERN_C_BEGIN extern "C" {
#define ABI47_0_0YG_EXTERN_C_END }
#else
#define ABI47_0_0YG_EXTERN_C_BEGIN
#define ABI47_0_0YG_EXTERN_C_END
#endif

#ifdef _WINDLL
#define WIN_EXPORT __declspec(dllexport)
#else
#define WIN_EXPORT
#endif

#ifndef YOGA_EXPORT
#ifdef _MSC_VER
#define YOGA_EXPORT
#else
#define YOGA_EXPORT __attribute__((visibility("default")))
#endif
#endif

#ifdef NS_ENUM
// Cannot use NSInteger as NSInteger has a different size than int (which is the
// default type of a enum). Therefor when linking the Yoga C library into obj-c
// the header is a missmatch for the Yoga ABI.
#define ABI47_0_0YG_ENUM_BEGIN(name) NS_ENUM(int, name)
#define ABI47_0_0YG_ENUM_END(name)
#else
#define ABI47_0_0YG_ENUM_BEGIN(name) enum name
#define ABI47_0_0YG_ENUM_END(name) name
#endif

#ifdef __GNUC__
#define ABI47_0_0YG_DEPRECATED __attribute__((deprecated))
#elif defined(_MSC_VER)
#define ABI47_0_0YG_DEPRECATED __declspec(deprecated)
#elif __cplusplus >= 201402L
#if defined(__has_cpp_attribute)
#if __has_cpp_attribute(deprecated)
#define ABI47_0_0YG_DEPRECATED [[deprecated]]
#endif
#endif
#endif
