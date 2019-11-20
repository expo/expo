// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI34_0_0EXPermissions/ABI34_0_0EXPermissions.h>
#import <UserNotifications/UserNotifications.h>

@interface ABI34_0_0EXUserNotificationRequester : NSObject <ABI34_0_0EXPermissionRequester>

- (instancetype)initWithModuleRegistry: (ABI34_0_0UMModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry;

@end
