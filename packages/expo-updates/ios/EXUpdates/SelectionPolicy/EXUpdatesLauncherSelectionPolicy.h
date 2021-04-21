//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesLauncherSelectionPolicy

- (nullable EXUpdatesUpdate *)launchableUpdateWithUpdates:(NSArray<EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
