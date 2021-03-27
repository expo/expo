//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0EXSyncSelectionPolicy

- (nullable ABI39_0_0EXSyncManifest *)launchableUpdateWithUpdates:(NSArray<ABI39_0_0EXSyncManifest *> *)updates;
- (NSArray<ABI39_0_0EXSyncManifest *> *)updatesToDeleteWithLaunchedUpdate:(ABI39_0_0EXSyncManifest *)launchedUpdate updates:(NSArray<ABI39_0_0EXSyncManifest *> *)updates;
- (BOOL)shouldLoadNewUpdate:(nullable ABI39_0_0EXSyncManifest *)newUpdate withLaunchedUpdate:(nullable ABI39_0_0EXSyncManifest *)launchedUpdate;

@end

NS_ASSUME_NONNULL_END
