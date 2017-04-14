/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI16_0_0/ABI16_0_0RCTDefines.h>

extern NSString *const ABI16_0_0RCTJavaScriptLoaderErrorDomain;

NS_ENUM(NSInteger) {
  ABI16_0_0RCTJavaScriptLoaderErrorNoScriptURL = 1,
  ABI16_0_0RCTJavaScriptLoaderErrorFailedOpeningFile = 2,
  ABI16_0_0RCTJavaScriptLoaderErrorFailedReadingFile = 3,
  ABI16_0_0RCTJavaScriptLoaderErrorFailedStatingFile = 3,
  ABI16_0_0RCTJavaScriptLoaderErrorURLLoadFailed = 3,
  ABI16_0_0RCTJavaScriptLoaderErrorBCVersion = 4,
  ABI16_0_0RCTJavaScriptLoaderErrorBCNotSupported = 4,

  ABI16_0_0RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously = 1000,
};

@interface ABI16_0_0RCTLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (strong, nonatomic) NSNumber *done;
@property (strong, nonatomic) NSNumber *total;

@end

typedef void (^ABI16_0_0RCTSourceLoadProgressBlock)(ABI16_0_0RCTLoadingProgress *progressData);
typedef void (^ABI16_0_0RCTSourceLoadBlock)(NSError *error, NSData *source, int64_t sourceLength);

@interface ABI16_0_0RCTJavaScriptLoader : NSObject

+ (void)loadBundleAtURL:(NSURL *)scriptURL onProgress:(ABI16_0_0RCTSourceLoadProgressBlock)onProgress onComplete:(ABI16_0_0RCTSourceLoadBlock)onComplete;

/**
 * @experimental
 * Attempts to synchronously load the script at the given URL. The following two conditions must be met:
 *   1. It must be a file URL.
 *   2. It must not point to a text/javascript file.
 * If the URL does not meet those conditions, this method will return nil and supply an error with the domain
 * ABI16_0_0RCTJavaScriptLoaderErrorDomain and the code ABI16_0_0RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously.
 */
+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                               runtimeBCVersion:(int32_t)runtimeBCVersion
                                   sourceLength:(int64_t *)sourceLength
                                          error:(NSError **)error;

@end
