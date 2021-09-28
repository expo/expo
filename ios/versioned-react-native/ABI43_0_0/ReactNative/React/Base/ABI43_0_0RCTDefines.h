/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if __OBJC__
#import <Foundation/Foundation.h>
#endif

/**
 * Make global functions usable in C++
 */
#if defined(__cplusplus)
#define ABI43_0_0RCT_EXTERN extern "C" __attribute__((visibility("default")))
#define ABI43_0_0RCT_EXTERN_C_BEGIN extern "C" {
#define ABI43_0_0RCT_EXTERN_C_END }
#else
#define ABI43_0_0RCT_EXTERN extern __attribute__((visibility("default")))
#define ABI43_0_0RCT_EXTERN_C_BEGIN
#define ABI43_0_0RCT_EXTERN_C_END
#endif

/**
 * The ABI43_0_0RCT_DEBUG macro can be used to exclude error checking and logging code
 * from release builds to improve performance and reduce binary size.
 */
#ifndef ABI43_0_0RCT_DEBUG
#if DEBUG
#define ABI43_0_0RCT_DEBUG 1
#else
#define ABI43_0_0RCT_DEBUG 0
#endif
#endif

/**
 * The ABI43_0_0RCT_DEV macro can be used to enable or disable development tools
 * such as the debug executors, dev menu, red box, etc.
 */
#ifndef ABI43_0_0RCT_DEV
#if DEBUG
#define ABI43_0_0RCT_DEV 1
#else
#define ABI43_0_0RCT_DEV 0
#endif
#endif

/**
 * ABI43_0_0RCT_DEV_MENU can be used to toggle the dev menu separately from ABI43_0_0RCT_DEV.
 * By default though, it will inherit from ABI43_0_0RCT_DEV.
 */
#ifndef ABI43_0_0RCT_DEV_MENU
#define ABI43_0_0RCT_DEV_MENU ABI43_0_0RCT_DEV
#endif

#ifndef ABI43_0_0RCT_ENABLE_INSPECTOR
#if ABI43_0_0RCT_DEV && __has_include(<ABI43_0_0React/ABI43_0_0RCTInspectorDevServerHelper.h>)
#define ABI43_0_0RCT_ENABLE_INSPECTOR 1
#else
#define ABI43_0_0RCT_ENABLE_INSPECTOR 0
#endif
#endif

#ifndef ABI43_0_0ENABLE_PACKAGER_CONNECTION
#if ABI43_0_0RCT_DEV && (__has_include("ABI43_0_0RCTPackagerConnection.h") || __has_include(<ABI43_0_0React/ABI43_0_0RCTPackagerConnection.h>))
#define ABI43_0_0ENABLE_PACKAGER_CONNECTION 1
#else
#define ABI43_0_0ENABLE_PACKAGER_CONNECTION 0
#endif
#endif

#if ABI43_0_0RCT_DEV
#define ABI43_0_0RCT_IF_DEV(...) __VA_ARGS__
#else
#define ABI43_0_0RCT_IF_DEV(...)
#endif

#ifndef ABI43_0_0RCT_PROFILE
#define ABI43_0_0RCT_PROFILE ABI43_0_0RCT_DEV
#endif

/**
 * Add the default Metro packager port number
 */
#ifndef ABI43_0_0RCT_METRO_PORT
#define ABI43_0_0RCT_METRO_PORT 8081
#else
// test if ABI43_0_0RCT_METRO_PORT is empty
#define ABI43_0_0RCT_METRO_PORT_DO_EXPAND(VAL) VAL##1
#define ABI43_0_0RCT_METRO_PORT_EXPAND(VAL) ABI43_0_0RCT_METRO_PORT_DO_EXPAND(VAL)
#if !defined(ABI43_0_0RCT_METRO_PORT) || (ABI43_0_0RCT_METRO_PORT_EXPAND(ABI43_0_0RCT_METRO_PORT) == 1)
// Only here if ABI43_0_0RCT_METRO_PORT is not defined
// OR ABI43_0_0RCT_METRO_PORT is the empty string
#undef ABI43_0_0RCT_METRO_PORT
#define ABI43_0_0RCT_METRO_PORT 8081
#endif
#endif

/**
 * Add the default packager name
 */
#ifndef ABI43_0_0RCT_PACKAGER_NAME
#define ABI43_0_0RCT_PACKAGER_NAME @"Metro"
#endif

/**
 * By default, only raise an NSAssertion in debug mode
 * (custom assert functions will still be called).
 */
#ifndef ABI43_0_0RCT_NSASSERT
#define ABI43_0_0RCT_NSASSERT ABI43_0_0RCT_DEBUG
#endif

/**
 * Concat two literals. Supports macro expansions,
 * e.g. ABI43_0_0RCT_CONCAT(foo, __FILE__).
 */
#define ABI43_0_0RCT_CONCAT2(A, B) A##B
#define ABI43_0_0RCT_CONCAT(A, B) ABI43_0_0RCT_CONCAT2(A, B)

/**
 * This attribute is used for static analysis.
 */
#if !defined ABI43_0_0RCT_DYNAMIC
#if __has_attribute(objc_dynamic)
#define ABI43_0_0RCT_DYNAMIC __attribute__((objc_dynamic))
#else
#define ABI43_0_0RCT_DYNAMIC
#endif
#endif

/**
 * Throw an assertion for unimplemented methods.
 */
#define ABI43_0_0RCT_NOT_IMPLEMENTED(method)                                                                     \
  _Pragma("clang diagnostic push") _Pragma("clang diagnostic ignored \"-Wmissing-method-return-type\"") \
      _Pragma("clang diagnostic ignored \"-Wunused-parameter\"")                                        \
          ABI43_0_0RCT_EXTERN NSException *_ABI43_0_0RCTNotImplementedException(SEL, Class);                              \
  method NS_UNAVAILABLE                                                                                 \
  {                                                                                                     \
    @throw _ABI43_0_0RCTNotImplementedException(_cmd, [self class]);                                             \
  }                                                                                                     \
  _Pragma("clang diagnostic pop")

#define ABI43_0_0EX_REMOVE_VERSION(string) (([string hasPrefix:@"ABI43_0_0"]) ? [string stringByReplacingCharactersInRange:(NSRange){0,@"ABI43_0_0".length} withString:@""] : string)
