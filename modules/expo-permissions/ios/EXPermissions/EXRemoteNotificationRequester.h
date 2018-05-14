// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>

FOUNDATION_EXPORT NSString * const EXAppDidRegisterForRemoteNotificationsNotification;

@interface EXRemoteNotificationRequester : NSObject <EXPermissionRequester, EXPermissionRequesterDelegate>

+ (NSDictionary *)permissions;

@end
