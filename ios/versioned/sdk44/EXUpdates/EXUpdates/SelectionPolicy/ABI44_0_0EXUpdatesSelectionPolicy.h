//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesLauncherSelectionPolicy.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesLoaderSelectionPolicy.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesReaperSelectionPolicy.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesSelectionPolicy : NSObject

@property (nonatomic, strong, readonly) id<ABI44_0_0EXUpdatesLauncherSelectionPolicy> launcherSelectionPolicy;
@property (nonatomic, strong, readonly) id<ABI44_0_0EXUpdatesLoaderSelectionPolicy> loaderSelectionPolicy;
@property (nonatomic, strong, readonly) id<ABI44_0_0EXUpdatesReaperSelectionPolicy> reaperSelectionPolicy;

- (instancetype)initWithLauncherSelectionPolicy:(id<ABI44_0_0EXUpdatesLauncherSelectionPolicy>)launcherSelectionPolicy
                          loaderSelectionPolicy:(id<ABI44_0_0EXUpdatesLoaderSelectionPolicy>)loaderSelectionPolicy
                          reaperSelectionPolicy:(id<ABI44_0_0EXUpdatesReaperSelectionPolicy>)reaperSelectionPolicy;

- (nullable ABI44_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI44_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (NSArray<ABI44_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI44_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI44_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (BOOL)shouldLoadNewUpdate:(nullable ABI44_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI44_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
