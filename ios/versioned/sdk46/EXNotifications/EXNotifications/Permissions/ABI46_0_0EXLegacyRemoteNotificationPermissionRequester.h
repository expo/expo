// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXPermissionsInterface.h>
#import <ABI46_0_0EXNotifications/ABI46_0_0EXRemoteNotificationPermissionSingletonModule.h>

// TODO: Remove once we deprecate and remove "notifications" permission type
@interface ABI46_0_0EXLegacyRemoteNotificationPermissionRequester : NSObject <ABI46_0_0EXPermissionsRequester, ABI46_0_0EXRemoteNotificationPermissionDelegate>

- (instancetype)initWithUserNotificationPermissionRequester:(id<ABI46_0_0EXPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<ABI46_0_0EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
                                            withMethodQueue:(dispatch_queue_t)methodQueue;

@end
