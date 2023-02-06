//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAppLauncher.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesAppLauncherNoDatabase : NSObject <ABI48_0_0EXUpdatesAppLauncher>

- (void)launchUpdateWithConfig:(ABI48_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END

