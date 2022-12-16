//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesAppLauncher.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesAppLauncherNoDatabase : NSObject <ABI45_0_0EXUpdatesAppLauncher>

- (void)launchUpdateWithConfig:(ABI45_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END

