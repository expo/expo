// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXNotifications.h"

FOUNDATION_EXPORT NSNotificationName kEXKernelGetPushTokenNotification DEPRECATED_ATTRIBUTE;

@interface NSData (EXRemoteNotification)

- (NSString *)apnsTokenString;

@end

@interface EXRemoteNotificationManager : NSObject <EXNotificationsScopedModuleDelegate>

- (void)registerForRemoteNotifications;
- (void)registerAPNSToken: (NSData *)token;
- (void)handleRemoteNotification: (NSDictionary *)notification fromBackground:(BOOL)isFromBackground;

/**
 *  Returns the APNS token string persisted to disk on the device, if any.
 */
- (NSString *)apnsTokenString;

@end
