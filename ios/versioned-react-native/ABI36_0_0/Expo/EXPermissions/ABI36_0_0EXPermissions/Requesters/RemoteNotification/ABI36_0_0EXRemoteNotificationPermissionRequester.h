// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMPermissionsInterface/ABI36_0_0UMPermissionsInterface.h>
#import <ABI36_0_0EXPermissions/ABI36_0_0EXPermissions.h>
#import <ABI36_0_0EXPermissions/ABI36_0_0EXUserNotificationPermissionRequester.h>

FOUNDATION_EXPORT NSString * const ABI36_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI36_0_0EXRemoteNotificationPermissionRequester : NSObject<ABI36_0_0UMPermissionsRequester>

- (instancetype)initWithUserNotificationPermissionRequester:(ABI36_0_0EXUserNotificationPermissionRequester *)userNotificationPermissionRequester
                                            withMethodQueue:(dispatch_queue_t)methodQueue;
@end
