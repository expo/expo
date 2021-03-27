//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncLauncher.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXSyncLauncherNoDatabase : NSObject <ABI39_0_0EXSyncLauncher>

- (void)launchUpdateWithConfig:(ABI39_0_0EXSyncConfig *)config;
- (void)launchUpdateWithConfig:(ABI39_0_0EXSyncConfig *)config fatalError:(NSError *)error;
+ (nullable NSString *)consumeError;

@end

NS_ASSUME_NONNULL_END

