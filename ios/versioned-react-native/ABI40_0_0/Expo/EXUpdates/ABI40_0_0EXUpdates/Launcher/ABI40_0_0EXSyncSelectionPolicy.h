//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI40_0_0EXSyncSelectionPolicy

- (nullable ABI40_0_0EXSyncManifest *)launchableUpdateWithUpdates:(NSArray<ABI40_0_0EXSyncManifest *> *)updates;
- (NSArray<ABI40_0_0EXSyncManifest *> *)updatesToDeleteWithLaunchedUpdate:(ABI40_0_0EXSyncManifest *)launchedUpdate updates:(NSArray<ABI40_0_0EXSyncManifest *> *)updates;
- (BOOL)shouldLoadNewUpdate:(nullable ABI40_0_0EXSyncManifest *)newUpdate withLaunchedUpdate:(nullable ABI40_0_0EXSyncManifest *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
