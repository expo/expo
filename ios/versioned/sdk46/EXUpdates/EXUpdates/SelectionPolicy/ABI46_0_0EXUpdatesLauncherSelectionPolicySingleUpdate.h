//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesLauncherSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A trivial ABI46_0_0EXUpdatesLauncherSelectionPolicy that will choose a single predetermined update to launch.
 */
@interface ABI46_0_0EXUpdatesLauncherSelectionPolicySingleUpdate : NSObject <ABI46_0_0EXUpdatesLauncherSelectionPolicy>

- (instancetype)initWithUpdateID:(NSUUID *)updateId;

@end

NS_ASSUME_NONNULL_END
