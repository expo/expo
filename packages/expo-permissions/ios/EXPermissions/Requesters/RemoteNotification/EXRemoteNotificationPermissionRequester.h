// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMPermissionsInterface/UMPermissionsInterface.h>
#import <EXPermissions/EXPermissions.h>

FOUNDATION_EXPORT NSString * const EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface EXRemoteNotificationPermissionRequester : NSObject<UMPermissionsRequester>

- (instancetype)initWithUserNotificationPermissionRequester:(id<UMPermissionsRequester>)userNotificationPermissionRequester
                                            withMethodQueue:(dispatch_queue_t)methodQueue;
@end
