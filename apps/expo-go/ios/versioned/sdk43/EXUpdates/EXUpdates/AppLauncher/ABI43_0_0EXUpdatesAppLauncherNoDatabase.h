//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppLauncher.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXUpdatesAppLauncherNoDatabase : NSObject <ABI43_0_0EXUpdatesAppLauncher>

- (void)launchUpdateWithConfig:(ABI43_0_0EXUpdatesConfig *)config;
- (void)launchUpdateWithConfig:(ABI43_0_0EXUpdatesConfig *)config fatalError:(NSError *)error;
+ (nullable NSString *)consumeError;

@end

NS_ASSUME_NONNULL_END

