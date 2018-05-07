// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppLoader.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Private header that should only be used by EXUpdatesManager kernel service
 */

@interface EXAppLoader ()

/**
 * Fetch JS bundle without any side effects or interaction with the timer.
 */
- (void)fetchJSBundleWithManifest:(NSDictionary *)manifest
                    cacheBehavior:(EXCachedResourceBehavior)cacheBehavior
                  timeoutInterval:(NSTimeInterval)timeoutInterval
                         progress:(void (^ _Nullable )(EXLoadingProgress *))progressBlock
                          success:(void (^)(NSData *))successBlock
                            error:(void (^)(NSError *))errorBlock;

@end

NS_ASSUME_NONNULL_END
