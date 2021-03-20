//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesAppLauncher.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesAppLauncherNoDatabase : NSObject <ABI41_0_0EXUpdatesAppLauncher>

- (void)launchUpdateWithConfig:(ABI41_0_0EXUpdatesConfig *)config;
- (void)launchUpdateWithConfig:(ABI41_0_0EXUpdatesConfig *)config fatalError:(NSError *)error;
+ (nullable NSString *)consumeError;

@end

NS_ASSUME_NONNULL_END

