// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsInterface.h>
#import <ABI37_0_0EXPermissions/ABI37_0_0EXPermissions.h>

FOUNDATION_EXPORT NSString * const ABI37_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI37_0_0EXRemoteNotificationPermissionRequester : NSObject<ABI37_0_0UMPermissionsRequester>

- (instancetype)initWithUserNotificationPermissionRequester:(id<ABI37_0_0UMPermissionsRequester>)userNotificationPermissionRequester
                                            withMethodQueue:(dispatch_queue_t)methodQueue;
@end
