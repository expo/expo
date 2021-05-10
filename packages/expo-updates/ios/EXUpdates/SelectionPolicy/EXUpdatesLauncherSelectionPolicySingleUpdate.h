//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesLauncherSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A trivial EXUpdatesLauncherSelectionPolicy that will choose a single predetermined update to launch.
 */
@interface EXUpdatesLauncherSelectionPolicySingleUpdate : NSObject <EXUpdatesLauncherSelectionPolicy>

- (instancetype)initWithUpdateID:(NSUUID *)updateId;

@end

NS_ASSUME_NONNULL_END
