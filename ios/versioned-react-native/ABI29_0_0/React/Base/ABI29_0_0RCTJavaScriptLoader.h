/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI29_0_0/ABI29_0_0RCTDefines.h>

extern NSString *const ABI29_0_0RCTJavaScriptLoaderErrorDomain;

NS_ENUM(NSInteger) {
  ABI29_0_0RCTJavaScriptLoaderErrorNoScriptURL = 1,
  ABI29_0_0RCTJavaScriptLoaderErrorFailedOpeningFile = 2,
  ABI29_0_0RCTJavaScriptLoaderErrorFailedReadingFile = 3,
  ABI29_0_0RCTJavaScriptLoaderErrorFailedStatingFile = 3,
  ABI29_0_0RCTJavaScriptLoaderErrorURLLoadFailed = 3,
  ABI29_0_0RCTJavaScriptLoaderErrorBCVersion = 4,
  ABI29_0_0RCTJavaScriptLoaderErrorBCNotSupported = 4,

  ABI29_0_0RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously = 1000,
};

NS_ENUM(NSInteger) {
  ABI29_0_0RCTSourceFilesChangedCountNotBuiltByBundler = -2,
  ABI29_0_0RCTSourceFilesChangedCountRebuiltFromScratch = -1,
};

@interface ABI29_0_0RCTLoadingProgress : NSObject

@property (nonatomic, copy) NSString *status;
@property (strong, nonatomic) NSNumber *done;
@property (strong, nonatomic) NSNumber *total;

@end

@interface ABI29_0_0RCTSource : NSObject

/**
 * URL of the source object.
 */
@property (strong, nonatomic, readonly) NSURL *url;

/**
 * JS source (or simply the binary header in the case of a RAM bundle).
 */
@property (strong, nonatomic, readonly) NSData *data;

/**
 * Length of the entire JS bundle. Note that self.length != self.data.length in the case of certain bundle formats. For
 * instance, when using RAM bundles:
 *
 *  - self.data will point to the bundle header
 *  - self.data.length is the length of the bundle header, i.e. sizeof(facebook::ReactABI29_0_0::BundleHeader)
 *  - self.length is the length of the entire bundle file (header + contents)
 */
@property (nonatomic, readonly) NSUInteger length;

/**
 * Returns number of files changed when building this bundle:
 *
 *  - ABI29_0_0RCTSourceFilesChangedCountNotBuiltByBundler if the source wasn't built by the bundler (e.g. read from disk)
 *  - ABI29_0_0RCTSourceFilesChangedCountRebuiltFromScratch if the source was rebuilt from scratch by the bundler
 *  - Otherwise, the number of files changed when incrementally rebuilding the source
 */
@property (nonatomic, readonly) NSInteger filesChangedCount;

@end

typedef void (^ABI29_0_0RCTSourceLoadProgressBlock)(ABI29_0_0RCTLoadingProgress *progressData);
typedef void (^ABI29_0_0RCTSourceLoadBlock)(NSError *error, ABI29_0_0RCTSource *source);

@interface ABI29_0_0RCTJavaScriptLoader : NSObject

+ (void)loadBundleAtURL:(NSURL *)scriptURL onProgress:(ABI29_0_0RCTSourceLoadProgressBlock)onProgress onComplete:(ABI29_0_0RCTSourceLoadBlock)onComplete;

/**
 * @experimental
 * Attempts to synchronously load the script at the given URL. The following two conditions must be met:
 *   1. It must be a file URL.
 *   2. It must not point to a text/javascript file.
 * If the URL does not meet those conditions, this method will return nil and supply an error with the domain
 * ABI29_0_0RCTJavaScriptLoaderErrorDomain and the code ABI29_0_0RCTJavaScriptLoaderErrorCannotBeLoadedSynchronously.
 */
+ (NSData *)attemptSynchronousLoadOfBundleAtURL:(NSURL *)scriptURL
                               runtimeBCVersion:(int32_t)runtimeBCVersion
                                   sourceLength:(int64_t *)sourceLength
                                          error:(NSError **)error;

@end
