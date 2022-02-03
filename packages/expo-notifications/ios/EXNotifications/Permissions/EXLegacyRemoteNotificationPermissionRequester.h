// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <EXNotifications/EXRemoteNotificationPermissionSingletonModule.h>

// TODO: Remove once we deprecate and remove "notifications" permission type
@interface EXLegacyRemoteNotificationPermissionRequester : NSObject <EXPermissionsRequester, EXRemoteNotificationPermissionDelegate>

- (instancetype)initWithUserNotificationPermissionRequester:(id<EXPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
                                            withMethodQueue:(dispatch_queue_t)methodQueue;

@end
