/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

extern uint32_t const ABI8_0_0RCTRAMBundleMagicNumber;

extern NSString *const ABI8_0_0RCTJavaScriptLoaderErrorDomain;

NS_ENUM(NSInteger) {
  ABI8_0_0RCTJavaScriptLoaderErrorNoScriptURL = 1,
  ABI8_0_0RCTJavaScriptLoaderErrorFailedOpeningFile = 2,
  ABI8_0_0RCTJavaScriptLoaderErrorFailedReadingFile = 3,
  ABI8_0_0RCTJavaScriptLoaderErrorFailedStatingFile = 3,
  ABI8_0_0RCTJavaScriptLoaderErrorURLLoadFailed = 3,

  ABI8_0_0RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously = 1000,
};

typedef void (^ABI8_0_0RCTSourceLoadBlock)(NSError *error, NSData *source, int64_t sourceLength);

@interface ABI8_0_0RCTJavaScriptLoader : NSObject

+ (void)loadBundleAtURL:(NSURL *)scriptURL onComplete:(ABI8_0_0RCTSourceLoadBlock)onComplete;

/**
 * @experimental
 * Attempts to synchronously load the script at the given URL. The following two conditions must be met:
 *   1. It must be a file URL.
 *   2. It must point to a RAM bundle.
 * If the URL does not meet those conditions, this method will return nil and supply an error with the domain
 * ABI8_0_0RCTJavaScriptLoaderErrorDomain and the code ABI8_0_0RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously.
 */
+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                                   sourceLength:(int64_t *)sourceLength
                                          error:(NSError **)error;

@end
