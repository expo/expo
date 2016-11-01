/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <tgmath.h>

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI11_0_0RCTAssert.h"
#import "ABI11_0_0RCTDefines.h"

NS_ASSUME_NONNULL_BEGIN

// JSON serialization/deserialization
ABI11_0_0RCT_EXTERN NSString *__nullable ABI11_0_0RCTJSONStringify(id __nullable jsonObject, NSError **error);
ABI11_0_0RCT_EXTERN id __nullable ABI11_0_0RCTJSONParse(NSString *__nullable jsonString, NSError **error);
ABI11_0_0RCT_EXTERN id __nullable ABI11_0_0RCTJSONParseMutable(NSString *__nullable jsonString, NSError **error);

// Sanitize a JSON object by stripping invalid types and/or NaN values
ABI11_0_0RCT_EXTERN id ABI11_0_0RCTJSONClean(id object);

// Get MD5 hash of a string
ABI11_0_0RCT_EXTERN NSString *ABI11_0_0RCTMD5Hash(NSString *string);

// Check is we are currently on the main queue (not to be confused with
// the main thread, which is not neccesarily the same thing)
// https://twitter.com/olebegemann/status/738656134731599872
ABI11_0_0RCT_EXTERN BOOL ABI11_0_0RCTIsMainQueue(void);

// Execute the specified block on the main queue. Unlike dispatch_async()
// this will execute immediately if we're already on the main queue.
ABI11_0_0RCT_EXTERN void ABI11_0_0RCTExecuteOnMainQueue(dispatch_block_t block);

// Deprecated - do not use.
ABI11_0_0RCT_EXTERN void ABI11_0_0RCTExecuteOnMainThread(dispatch_block_t block, BOOL sync)
__deprecated_msg("Use ABI11_0_0RCTExecuteOnMainQueue instead. ABI11_0_0RCTExecuteOnMainQueue is "
                 "async. If you need to use the `sync` option... please don't.");

// Get screen metrics in a thread-safe way
ABI11_0_0RCT_EXTERN CGFloat ABI11_0_0RCTScreenScale(void);
ABI11_0_0RCT_EXTERN CGSize ABI11_0_0RCTScreenSize(void);

// Round float coordinates to nearest whole screen pixel (not point)
ABI11_0_0RCT_EXTERN CGFloat ABI11_0_0RCTRoundPixelValue(CGFloat value);
ABI11_0_0RCT_EXTERN CGFloat ABI11_0_0RCTCeilPixelValue(CGFloat value);
ABI11_0_0RCT_EXTERN CGFloat ABI11_0_0RCTFloorPixelValue(CGFloat value);

// Convert a size in points to pixels, rounded up to the nearest integral size
ABI11_0_0RCT_EXTERN CGSize ABI11_0_0RCTSizeInPixels(CGSize pointSize, CGFloat scale);

// Method swizzling
ABI11_0_0RCT_EXTERN void ABI11_0_0RCTSwapClassMethods(Class cls, SEL original, SEL replacement);
ABI11_0_0RCT_EXTERN void ABI11_0_0RCTSwapInstanceMethods(Class cls, SEL original, SEL replacement);

// Module subclass support
ABI11_0_0RCT_EXTERN BOOL ABI11_0_0RCTClassOverridesClassMethod(Class cls, SEL selector);
ABI11_0_0RCT_EXTERN BOOL ABI11_0_0RCTClassOverridesInstanceMethod(Class cls, SEL selector);

// Creates a standardized error object to return in callbacks
ABI11_0_0RCT_EXTERN NSDictionary<NSString *, id> *ABI11_0_0RCTMakeError(NSString *message, id __nullable toStringify, NSDictionary<NSString *, id> *__nullable extraData);
ABI11_0_0RCT_EXTERN NSDictionary<NSString *, id> *ABI11_0_0RCTMakeAndLogError(NSString *message, id __nullable toStringify, NSDictionary<NSString *, id> *__nullable extraData);
ABI11_0_0RCT_EXTERN NSDictionary<NSString *, id> *ABI11_0_0RCTJSErrorFromNSError(NSError *error);
ABI11_0_0RCT_EXTERN NSDictionary<NSString *, id> *ABI11_0_0RCTJSErrorFromCodeMessageAndNSError(NSString *code, NSString *message, NSError *__nullable error);

// The default error code to use as the `code` property for callback error objects
ABI11_0_0RCT_EXTERN NSString *const ABI11_0_0RCTErrorUnspecified;

// Returns YES if ReactABI11_0_0 is running in a test environment
ABI11_0_0RCT_EXTERN BOOL ABI11_0_0RCTRunningInTestEnvironment(void);

// Returns YES if ReactABI11_0_0 is running in an iOS App Extension
ABI11_0_0RCT_EXTERN BOOL ABI11_0_0RCTRunningInAppExtension(void);

// Returns the shared UIApplication instance, or nil if running in an App Extension
ABI11_0_0RCT_EXTERN UIApplication *__nullable ABI11_0_0RCTSharedApplication(void);

// Returns the current main window, useful if you need to access the root view
// or view controller
ABI11_0_0RCT_EXTERN UIWindow *__nullable ABI11_0_0RCTKeyWindow(void);

// Returns the presented view controller, useful if you need
// e.g. to present a modal view controller or alert over it
ABI11_0_0RCT_EXTERN UIViewController *__nullable ABI11_0_0RCTPresentedViewController(void);

// Does this device support force touch (aka 3D Touch)?
ABI11_0_0RCT_EXTERN BOOL ABI11_0_0RCTForceTouchAvailable(void);

// Create an NSError in the ABI11_0_0RCTErrorDomain
ABI11_0_0RCT_EXTERN NSError *ABI11_0_0RCTErrorWithMessage(NSString *message);

// Convert nil values to NSNull, and vice-versa
#define ABI11_0_0RCTNullIfNil(value) (value ?: (id)kCFNull)
#define ABI11_0_0RCTNilIfNull(value) (value == (id)kCFNull ? nil : value)

// Convert NaN or infinite values to zero, as these aren't JSON-safe
ABI11_0_0RCT_EXTERN double ABI11_0_0RCTZeroIfNaN(double value);

// Convert data to a Base64-encoded data URL
ABI11_0_0RCT_EXTERN NSURL *ABI11_0_0RCTDataURL(NSString *mimeType, NSData *data);

// Gzip functionality - compression level in range 0 - 1 (-1 for default)
ABI11_0_0RCT_EXTERN NSData *__nullable ABI11_0_0RCTGzipData(NSData *__nullable data, float level);

// Returns the relative path within the main bundle for an absolute URL
// (or nil, if the URL does not specify a path within the main bundle)
ABI11_0_0RCT_EXTERN NSString *__nullable ABI11_0_0RCTBundlePathForURL(NSURL *__nullable URL);

// Determines if a given image URL refers to a local image
ABI11_0_0RCT_EXTERN BOOL ABI11_0_0RCTIsLocalAssetURL(NSURL *__nullable imageURL);

// Creates a new, unique temporary file path with the specified extension
ABI11_0_0RCT_EXTERN NSString *__nullable ABI11_0_0RCTTempFilePath(NSString *__nullable extension, NSError **error);

// Converts a CGColor to a hex string
ABI11_0_0RCT_EXTERN NSString *ABI11_0_0RCTColorToHexString(CGColorRef color);

// Get standard localized string (if it exists)
ABI11_0_0RCT_EXTERN NSString *ABI11_0_0RCTUIKitLocalizedString(NSString *string);

// URL manipulation
ABI11_0_0RCT_EXTERN NSString *__nullable ABI11_0_0RCTGetURLQueryParam(NSURL *__nullable URL, NSString *param);
ABI11_0_0RCT_EXTERN NSURL *__nullable ABI11_0_0RCTURLByReplacingQueryParam(NSURL *__nullable URL, NSString *param, NSString *__nullable value);

NS_ASSUME_NONNULL_END
