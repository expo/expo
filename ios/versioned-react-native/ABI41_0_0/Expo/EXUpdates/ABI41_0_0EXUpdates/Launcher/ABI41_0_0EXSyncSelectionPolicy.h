//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI41_0_0EXSyncSelectionPolicy

- (nullable ABI41_0_0EXSyncManifest *)launchableUpdateWithUpdates:(NSArray<ABI41_0_0EXSyncManifest *> *)updates filters:(nullable NSDictionary *)filters;
- (NSArray<ABI41_0_0EXSyncManifest *> *)updatesToDeleteWithLaunchedUpdate:(ABI41_0_0EXSyncManifest *)launchedUpdate updates:(NSArray<ABI41_0_0EXSyncManifest *> *)updates filters:(nullable NSDictionary *)filters;
- (BOOL)shouldLoadNewUpdate:(nullable ABI41_0_0EXSyncManifest *)newUpdate withLaunchedUpdate:(nullable ABI41_0_0EXSyncManifest *)launchedUpdate filters:(nullable NSDictionary *)filters;

@end

NS_ASSUME_NONNULL_END
