//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAppLauncher.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesAppLauncherNoDatabase : NSObject <ABI44_0_0EXUpdatesAppLauncher>

- (void)launchUpdateWithConfig:(ABI44_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END

