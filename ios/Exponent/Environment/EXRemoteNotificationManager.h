// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXRemoteNotificationManager : NSObject

+ (instancetype)sharedInstance;

- (void)registerAPNSToken: (NSData *)token;
- (void)handleRemoteNotification: (NSDictionary *)notification;

@end
