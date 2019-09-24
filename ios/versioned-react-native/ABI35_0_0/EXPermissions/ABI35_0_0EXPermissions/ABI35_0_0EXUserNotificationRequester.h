// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI35_0_0EXPermissions/ABI35_0_0EXPermissions.h>
#import <UserNotifications/UserNotifications.h>

@interface ABI35_0_0EXUserNotificationRequester : NSObject <ABI35_0_0EXPermissionRequester>

- (instancetype)initWithModuleRegistry: (ABI35_0_0UMModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry;

@end
