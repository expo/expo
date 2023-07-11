// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXPermissionsInterface.h>
#import <ABI49_0_0EXNotifications/ABI49_0_0EXRemoteNotificationPermissionSingletonModule.h>

// TODO: Remove once we deprecate and remove "notifications" permission type
@interface ABI49_0_0EXLegacyRemoteNotificationPermissionRequester : NSObject <ABI49_0_0EXPermissionsRequester, ABI49_0_0EXRemoteNotificationPermissionDelegate>

- (instancetype)initWithUserNotificationPermissionRequester:(id<ABI49_0_0EXPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<ABI49_0_0EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
                                            withMethodQueue:(dispatch_queue_t)methodQueue;

@end
