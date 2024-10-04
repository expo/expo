//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncher.h>

@class EXUpdatesConfig;

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLauncherNoDatabase : NSObject <EXUpdatesAppLauncher>

- (void)launchUpdateWithConfig:(EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END

