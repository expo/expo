// Copyright © 2018 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>
#import <UserNotifications/UserNotifications.h>

@interface EXUserNotificationRequester : EXPermissionBaseRequester

- (instancetype)initWithModuleRegistry: (UMModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(UMModuleRegistry *)moduleRegistry;

@end
