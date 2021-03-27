// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppLoader.h"

#import <EXUpdates/EXSyncLauncher.h>
#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Private header that should only be used by EXSyncManager kernel service
 */

@interface EXAppLoader ()

@property (nonatomic, readonly, nullable) EXSyncConfig *config;
@property (nonatomic, readonly, nullable) id<EXSyncSelectionPolicy> selectionPolicy;
@property (nonatomic, readonly, nullable) id<EXSyncLauncher> appLauncher;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;

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
