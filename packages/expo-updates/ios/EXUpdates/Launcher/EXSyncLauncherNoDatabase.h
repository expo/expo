//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncLauncher.h>
#import <EXUpdates/EXSyncConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncLauncherNoDatabase : NSObject <EXSyncLauncher>

- (void)launchUpdateWithConfig:(EXSyncConfig *)config;
- (void)launchUpdateWithConfig:(EXSyncConfig *)config fatalError:(NSError *)error;
+ (nullable NSString *)consumeError;

@end

NS_ASSUME_NONNULL_END

