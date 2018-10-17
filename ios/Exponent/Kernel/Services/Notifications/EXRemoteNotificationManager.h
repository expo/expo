// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXNotifications.h"
#import "EXUserNotificationCenter.h"
#import <NotificationCenter/NotificationCenter.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXRemoteNotificationManager : NSObject <EXNotificationsScopedModuleDelegate>

- (void)registerForRemoteNotifications;
- (void)registerAPNSToken:(nullable NSData *)token registrationError:(nullable NSError *)error;
- (BOOL)supportsCurrentRuntimeEnvironment;
@end

NS_ASSUME_NONNULL_END
