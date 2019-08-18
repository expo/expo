// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI32_0_0EXPermissions/ABI32_0_0EXPermissions.h>
#import <UserNotifications/UserNotifications.h>

@interface ABI32_0_0EXUserNotificationRequester : NSObject <ABI32_0_0EXPermissionRequester>

- (instancetype)initWithModuleRegistry: (ABI32_0_0EXModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry;

@end
