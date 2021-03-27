//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncLauncher.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSyncLauncherNoDatabase : NSObject <ABI41_0_0EXSyncLauncher>

- (void)launchUpdateWithConfig:(ABI41_0_0EXSyncConfig *)config;
- (void)launchUpdateWithConfig:(ABI41_0_0EXSyncConfig *)config fatalError:(NSError *)error;
+ (nullable NSString *)consumeError;

@end

NS_ASSUME_NONNULL_END

