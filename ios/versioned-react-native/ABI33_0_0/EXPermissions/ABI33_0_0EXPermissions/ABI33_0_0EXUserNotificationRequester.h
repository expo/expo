// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI33_0_0EXPermissions/ABI33_0_0EXPermissions.h>
#import <UserNotifications/UserNotifications.h>

@interface ABI33_0_0EXUserNotificationRequester : NSObject <ABI33_0_0EXPermissionRequester>

- (instancetype)initWithModuleRegistry: (ABI33_0_0UMModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry;

@end
