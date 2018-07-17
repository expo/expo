// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXPermissions/ABI29_0_0EXPermissions.h>

FOUNDATION_EXPORT NSString * const ABI29_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI29_0_0EXRemoteNotificationRequester : NSObject <ABI29_0_0EXPermissionRequester, ABI29_0_0EXPermissionRequesterDelegate>

+ (NSDictionary *)permissions;

@end
