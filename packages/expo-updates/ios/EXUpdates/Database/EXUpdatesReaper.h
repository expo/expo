//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesReaper : NSObject

+ (void)reapUnusedUpdatesWithSelectionPolicy:(id<EXUpdatesSelectionPolicy>)selectionPolicy
                              launchedUpdate:(EXUpdatesUpdate *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
