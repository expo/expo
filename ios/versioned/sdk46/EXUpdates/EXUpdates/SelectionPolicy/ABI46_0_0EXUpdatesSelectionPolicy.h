//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesLauncherSelectionPolicy.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesLoaderSelectionPolicy.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesReaperSelectionPolicy.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXUpdatesSelectionPolicy : NSObject

@property (nonatomic, strong, readonly) id<ABI46_0_0EXUpdatesLauncherSelectionPolicy> launcherSelectionPolicy;
@property (nonatomic, strong, readonly) id<ABI46_0_0EXUpdatesLoaderSelectionPolicy> loaderSelectionPolicy;
@property (nonatomic, strong, readonly) id<ABI46_0_0EXUpdatesReaperSelectionPolicy> reaperSelectionPolicy;

- (instancetype)initWithLauncherSelectionPolicy:(id<ABI46_0_0EXUpdatesLauncherSelectionPolicy>)launcherSelectionPolicy
                          loaderSelectionPolicy:(id<ABI46_0_0EXUpdatesLoaderSelectionPolicy>)loaderSelectionPolicy
                          reaperSelectionPolicy:(id<ABI46_0_0EXUpdatesReaperSelectionPolicy>)reaperSelectionPolicy;

- (nullable ABI46_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI46_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (NSArray<ABI46_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI46_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI46_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (BOOL)shouldLoadNewUpdate:(nullable ABI46_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI46_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
