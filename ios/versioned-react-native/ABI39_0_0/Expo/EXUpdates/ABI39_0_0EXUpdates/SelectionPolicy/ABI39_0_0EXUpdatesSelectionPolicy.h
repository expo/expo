//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesLauncherSelectionPolicy.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesLoaderSelectionPolicy.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesReaperSelectionPolicy.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXUpdatesSelectionPolicy : NSObject

@property (nonatomic, strong, readonly) id<ABI39_0_0EXUpdatesLauncherSelectionPolicy> launcherSelectionPolicy;
@property (nonatomic, strong, readonly) id<ABI39_0_0EXUpdatesLoaderSelectionPolicy> loaderSelectionPolicy;
@property (nonatomic, strong, readonly) id<ABI39_0_0EXUpdatesReaperSelectionPolicy> reaperSelectionPolicy;

- (instancetype)initWithLauncherSelectionPolicy:(id<ABI39_0_0EXUpdatesLauncherSelectionPolicy>)launcherSelectionPolicy
                          loaderSelectionPolicy:(id<ABI39_0_0EXUpdatesLoaderSelectionPolicy>)loaderSelectionPolicy
                          reaperSelectionPolicy:(id<ABI39_0_0EXUpdatesReaperSelectionPolicy>)reaperSelectionPolicy;

- (nullable ABI39_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI39_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (NSArray<ABI39_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI39_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI39_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;
- (BOOL)shouldLoadNewUpdate:(nullable ABI39_0_0EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable ABI39_0_0EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
