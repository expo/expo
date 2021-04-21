//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesLoaderSelectionPolicy

- (BOOL)shouldLoadNewUpdate:(nullable EXUpdatesUpdate *)newUpdate withLaunchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
