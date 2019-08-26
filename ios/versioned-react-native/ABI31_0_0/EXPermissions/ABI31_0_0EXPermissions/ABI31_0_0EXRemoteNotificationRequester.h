// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXPermissions/ABI31_0_0EXPermissions.h>

FOUNDATION_EXPORT NSString * const ABI31_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI31_0_0EXRemoteNotificationRequester : NSObject <ABI31_0_0EXPermissionRequester, ABI31_0_0EXPermissionRequesterDelegate>

+ (NSDictionary *)permissions;

@end
