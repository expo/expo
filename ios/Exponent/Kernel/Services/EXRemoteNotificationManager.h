// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXNotifications.h"

@interface NSData (EXRemoteNotification)

- (NSString *)apnsTokenString;

@end

@interface EXRemoteNotificationManager : NSObject <EXNotificationsScopedModuleDelegate>

+ (instancetype)sharedInstance;

- (void)registerForRemoteNotifications;
- (void)registerAPNSToken: (NSData *)token;
- (void)handleRemoteNotification: (NSDictionary *)notification fromBackground:(BOOL)isFromBackground;

/**
 *  Returns the APNS token string persisted to disk on the device, if any.
 */
// TODO: formalize as kernelspace module utility
- (NSString *)apnsTokenString;

@end
