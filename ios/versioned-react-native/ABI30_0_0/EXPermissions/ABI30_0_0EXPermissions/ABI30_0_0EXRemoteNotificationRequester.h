// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXPermissions/ABI30_0_0EXPermissions.h>

FOUNDATION_EXPORT NSString * const ABI30_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI30_0_0EXRemoteNotificationRequester : NSObject <ABI30_0_0EXPermissionRequester, ABI30_0_0EXPermissionRequesterDelegate>

+ (NSDictionary *)permissions;

@end
