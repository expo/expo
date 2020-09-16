//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAppLauncher.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXUpdatesAppLauncherNoDatabase : NSObject <ABI39_0_0EXUpdatesAppLauncher>

- (void)launchUpdateWithConfig:(ABI39_0_0EXUpdatesConfig *)config;
- (void)launchUpdateWithConfig:(ABI39_0_0EXUpdatesConfig *)config fatalError:(NSError *)error;
+ (nullable NSString *)consumeError;

@end

NS_ASSUME_NONNULL_END

