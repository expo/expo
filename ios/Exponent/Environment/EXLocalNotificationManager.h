// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class UILocalNotification;

@interface EXLocalNotificationManager : NSObject

+ (instancetype)sharedInstance;

- (void)handleLocalNotification: (UILocalNotification *)notification fromBackground:(BOOL)isFromBackground;

@end
