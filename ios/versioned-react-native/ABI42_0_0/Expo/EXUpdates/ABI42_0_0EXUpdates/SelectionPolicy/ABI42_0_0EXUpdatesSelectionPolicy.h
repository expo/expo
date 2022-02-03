//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesLauncherSelectionPolicy.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesLoaderSelectionPolicy.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesReaperSelectionPolicy.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesSelectionPolicy : NSObject

@property (nonatomic, strong, readonly) id<ABI42_0_0EXUpdatesLauncherSelectionPolicy> launcherSelectionPolicy;
@property (nonatomic, strong, readonly) id<ABI42_0_0EXUpdatesLoaderSelectionPolicy> loaderSelectionPolicy;
@property (nonatomic, strong, readonly) id<ABI42_0_0EXUpdatesReaperSelectionPolicy> reaperSelectionPolicy;

- (instancetype)initWithLauncherSelectionPolicy:(id<ABI42_0_0EXUpdatesLauncherSelectionPolicy>)launcherSelectionPolicy
                          loaderSelectionPolicy:(id<ABI42_0_0EXUpdatesLoaderSelectionPolicy>)loaderSelectionPolicy
                          reaperSelectionPolicy:(id<ABI42_0_0EXUpdatesReaperSelectionPolicy>)reaperSelectionPolicy;

- (nullable ABI42_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI42_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (NSArray<ABI42_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI42_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI42_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (BOOL)shouldLoadNewUpdate:(nullable ABI42_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI42_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
