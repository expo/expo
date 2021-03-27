//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXSyncSelectionPolicy

- (nullable EXSyncManifest *)launchableUpdateWithUpdates:(NSArray<EXSyncManifest *> *)updates filters:(nullable NSDictionary *)filters;
- (NSArray<EXSyncManifest *> *)updatesToDeleteWithLaunchedUpdate:(EXSyncManifest *)launchedUpdate updates:(NSArray<EXSyncManifest *> *)updates filters:(nullable NSDictionary *)filters;
- (BOOL)shouldLoadNewUpdate:(nullable EXSyncManifest *)newUpdate withLaunchedUpdate:(nullable EXSyncManifest *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
