// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXNotifications.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXRemoteNotificationManager : NSObject <EXNotificationsScopedModuleDelegate>

- (void)registerForRemoteNotifications;
- (void)registerAPNSToken:(nullable NSData *)token registrationError:(nullable NSError *)error;
- (void)handleRemoteNotification:(nullable NSDictionary *)notification fromBackground:(BOOL)isFromBackground;

@end

NS_ASSUME_NONNULL_END
