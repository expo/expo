/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if __OBJC__
#  import <Foundation/Foundation.h>
#endif

/**
 * Make global functions usable in C++
 */
#if defined(__cplusplus)
#define ABI33_0_0RCT_EXTERN extern "C" __attribute__((visibility("default")))
#define ABI33_0_0RCT_EXTERN_C_BEGIN extern "C" {
#define ABI33_0_0RCT_EXTERN_C_END }
#else
#define ABI33_0_0RCT_EXTERN extern __attribute__((visibility("default")))
#define ABI33_0_0RCT_EXTERN_C_BEGIN
#define ABI33_0_0RCT_EXTERN_C_END
#endif

/**
 * The ABI33_0_0RCT_DEBUG macro can be used to exclude error checking and logging code
 * from release builds to improve performance and reduce binary size.
 */
#ifndef ABI33_0_0RCT_DEBUG
#if DEBUG
#define ABI33_0_0RCT_DEBUG 1
#else
#define ABI33_0_0RCT_DEBUG 0
#endif
#endif

/**
 * The ABI33_0_0RCT_DEV macro can be used to enable or disable development tools
 * such as the debug executors, dev menu, red box, etc.
 */
#ifndef ABI33_0_0RCT_DEV
#if DEBUG
#define ABI33_0_0RCT_DEV 1
#else
#define ABI33_0_0RCT_DEV 0
#endif
#endif

#ifndef ABI33_0_0RCT_ENABLE_INSPECTOR
#if ABI33_0_0RCT_DEV && __has_include(<ReactABI33_0_0/ABI33_0_0RCTInspectorDevServerHelper.h>)
#define ABI33_0_0RCT_ENABLE_INSPECTOR 1
#else
#define ABI33_0_0RCT_ENABLE_INSPECTOR 0
#endif
#endif

#ifndef ABI33_0_0ENABLE_PACKAGER_CONNECTION
#if ABI33_0_0RCT_DEV && __has_include(<ReactABI33_0_0/ABI33_0_0RCTPackagerConnection.h>)
#define ABI33_0_0ENABLE_PACKAGER_CONNECTION 1
#else
#define ABI33_0_0ENABLE_PACKAGER_CONNECTION 0
#endif
#endif

#if ABI33_0_0RCT_DEV
#define ABI33_0_0RCT_IF_DEV(...) __VA_ARGS__
#else
#define ABI33_0_0RCT_IF_DEV(...)
#endif

#ifndef ABI33_0_0RCT_PROFILE
#define ABI33_0_0RCT_PROFILE ABI33_0_0RCT_DEV
#endif

/**
 * Add the default Metro packager port number
 */
#ifndef ABI33_0_0RCT_METRO_PORT
#define ABI33_0_0RCT_METRO_PORT 8081
#else
// test if ABI33_0_0RCT_METRO_PORT is empty
#define ABI33_0_0RCT_METRO_PORT_DO_EXPAND(VAL)  VAL ## 1
#define ABI33_0_0RCT_METRO_PORT_EXPAND(VAL)     ABI33_0_0RCT_METRO_PORT_DO_EXPAND(VAL)
#if !defined(ABI33_0_0RCT_METRO_PORT) || (ABI33_0_0RCT_METRO_PORT_EXPAND(ABI33_0_0RCT_METRO_PORT) == 1)
// Only here if ABI33_0_0RCT_METRO_PORT is not defined
// OR ABI33_0_0RCT_METRO_PORT is the empty string
#undef ABI33_0_0RCT_METRO_PORT
#define ABI33_0_0RCT_METRO_PORT 8081
#endif
#endif

/**
 * By default, only raise an NSAssertion in debug mode
 * (custom assert functions will still be called).
 */
#ifndef ABI33_0_0RCT_NSASSERT
#define ABI33_0_0RCT_NSASSERT ABI33_0_0RCT_DEBUG
#endif

/**
 * Concat two literals. Supports macro expansions,
 * e.g. ABI33_0_0RCT_CONCAT(foo, __FILE__).
 */
#define ABI33_0_0RCT_CONCAT2(A, B) A ## B
#define ABI33_0_0RCT_CONCAT(A, B) ABI33_0_0RCT_CONCAT2(A, B)

/**
  * This attribute is used for static analysis.
  */
#if !defined ABI33_0_0RCT_DYNAMIC
#if __has_attribute(objc_dynamic)
#define ABI33_0_0RCT_DYNAMIC __attribute__((objc_dynamic))
#else
#define ABI33_0_0RCT_DYNAMIC
#endif
#endif

/**
 * Throw an assertion for unimplemented methods.
 */
#define ABI33_0_0RCT_NOT_IMPLEMENTED(method) \
_Pragma("clang diagnostic push") \
_Pragma("clang diagnostic ignored \"-Wmissing-method-return-type\"") \
_Pragma("clang diagnostic ignored \"-Wunused-parameter\"") \
ABI33_0_0RCT_EXTERN NSException *_ABI33_0_0RCTNotImplementedException(SEL, Class); \
method NS_UNAVAILABLE { @throw _ABI33_0_0RCTNotImplementedException(_cmd, [self class]); } \
_Pragma("clang diagnostic pop")

/**
 * Check if WebKit iOS 10.0 APIs are available.
 */
#define WEBKIT_IOS_10_APIS_AVAILABLE __has_include(<WebKit/WKAudiovisualMediaTypes.h>)

#define ABI33_0_0EX_REMOVE_VERSION(string) (([string hasPrefix:@"ABI33_0_0"]) ? [string stringByReplacingCharactersInRange:(NSRange){0,@"ABI33_0_0".length} withString:@""] : string)
