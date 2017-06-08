// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface NSUserDefaults (EXRemoteNotification)

- (NSData *)apnsToken;

@end

@interface NSData (EXRemoteNotification)

- (NSString *)apnsTokenString;

@end

@interface EXRemoteNotificationManager : NSObject

+ (instancetype)sharedInstance;

- (void)registerForRemoteNotifications;
- (void)registerAPNSToken: (NSData *)token;
- (void)handleRemoteNotification: (NSDictionary *)notification fromBackground:(BOOL)isFromBackground;

@end
