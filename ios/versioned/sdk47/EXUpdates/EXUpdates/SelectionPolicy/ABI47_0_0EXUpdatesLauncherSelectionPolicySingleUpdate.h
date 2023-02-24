//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesLauncherSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A trivial ABI47_0_0EXUpdatesLauncherSelectionPolicy that will choose a single predetermined update to launch.
 */
@interface ABI47_0_0EXUpdatesLauncherSelectionPolicySingleUpdate : NSObject <ABI47_0_0EXUpdatesLauncherSelectionPolicy>

- (instancetype)initWithUpdateID:(NSUUID *)updateId;

@end

NS_ASSUME_NONNULL_END
