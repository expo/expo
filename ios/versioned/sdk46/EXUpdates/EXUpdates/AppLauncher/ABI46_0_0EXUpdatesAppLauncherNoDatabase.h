//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesAppLauncher.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXUpdatesAppLauncherNoDatabase : NSObject <ABI46_0_0EXUpdatesAppLauncher>

- (void)launchUpdateWithConfig:(ABI46_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END

