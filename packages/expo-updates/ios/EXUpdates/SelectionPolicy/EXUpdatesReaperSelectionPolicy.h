//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesReaperSelectionPolicy

- (NSArray<EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(EXUpdatesUpdate *)launchedUpdate updates:(NSArray<EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
