/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#if __OBJC__
#  import <Foundation/Foundation.h>
#endif

/**
 * Make global functions usable in C++
 */
#if defined(__cplusplus)
#define ABI23_0_0RCT_EXTERN extern "C" __attribute__((visibility("default")))
#define ABI23_0_0RCT_EXTERN_C_BEGIN extern "C" {
#define ABI23_0_0RCT_EXTERN_C_END }
#else
#define ABI23_0_0RCT_EXTERN extern __attribute__((visibility("default")))
#define ABI23_0_0RCT_EXTERN_C_BEGIN
#define ABI23_0_0RCT_EXTERN_C_END
#endif

/**
 * The ABI23_0_0RCT_DEBUG macro can be used to exclude error checking and logging code
 * from release builds to improve performance and reduce binary size.
 */
#ifndef ABI23_0_0RCT_DEBUG
#if DEBUG
#define ABI23_0_0RCT_DEBUG 1
#else
#define ABI23_0_0RCT_DEBUG 0
#endif
#endif

/**
 * The ABI23_0_0RCT_DEV macro can be used to enable or disable development tools
 * such as the debug executors, dev menu, red box, etc.
 */
#ifndef ABI23_0_0RCT_DEV
#if DEBUG
#define ABI23_0_0RCT_DEV 1
#else
#define ABI23_0_0RCT_DEV 0
#endif
#endif

#ifndef ABI23_0_0RCT_ENABLE_INSPECTOR
#if ABI23_0_0RCT_DEV && __has_include(<ReactABI23_0_0/ABI23_0_0RCTInspectorDevServerHelper.h>)
#define ABI23_0_0RCT_ENABLE_INSPECTOR 1
#else
#define ABI23_0_0RCT_ENABLE_INSPECTOR 0
#endif
#endif

#ifndef ENABLE_PACKAGER_CONNECTION
#if ABI23_0_0RCT_DEV && __has_include(<ReactABI23_0_0/ABI23_0_0RCTPackagerConnection.h>)
#define ENABLE_PACKAGER_CONNECTION 1
#else
#define ENABLE_PACKAGER_CONNECTION 0
#endif
#endif

#if ABI23_0_0RCT_DEV
#define ABI23_0_0RCT_IF_DEV(...) __VA_ARGS__
#else
#define ABI23_0_0RCT_IF_DEV(...)
#endif

#ifndef ABI23_0_0RCT_PROFILE
#define ABI23_0_0RCT_PROFILE ABI23_0_0RCT_DEV
#endif

/**
 * By default, only raise an NSAssertion in debug mode
 * (custom assert functions will still be called).
 */
#ifndef ABI23_0_0RCT_NSASSERT
#define ABI23_0_0RCT_NSASSERT ABI23_0_0RCT_DEBUG
#endif

/**
 * Concat two literals. Supports macro expansions,
 * e.g. ABI23_0_0RCT_CONCAT(foo, __FILE__).
 */
#define ABI23_0_0RCT_CONCAT2(A, B) A ## B
#define ABI23_0_0RCT_CONCAT(A, B) ABI23_0_0RCT_CONCAT2(A, B)

/**
 * Throw an assertion for unimplemented methods.
 */
#define ABI23_0_0RCT_NOT_IMPLEMENTED(method) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wmissing-method-return-type\"") \
_Pragma("clang diagnostic ignored \"-Wunused-parameter\"") \
ABI23_0_0RCT_EXTERN NSException *_ABI23_0_0RCTNotImplementedException(SEL, Class); \
method NS_UNAVAILABLE { @throw _ABI23_0_0RCTNotImplementedException(_cmd, [self class]); } \
_Pragma("clang diagnostic pop")

  #define ABI23_0_0EX_REMOVE_VERSION(string) (([string hasPrefix:@"ABI23_0_0"]) ? [string stringByReplacingCharactersInRange:(NSRange){0,@"ABI23_0_0".length} withString:@""] : string)
