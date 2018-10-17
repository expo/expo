// Copyright © 2018 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>
#import <UserNotifications/UserNotifications.h>

@interface EXUserNotificationRequester : NSObject <EXPermissionRequester>

+ (NSDictionary *)permissionsWithModuleRegistry:(EXModuleRegistry *) moduleRegistry;
- (instancetype)initWithModuleRegistry: (EXModuleRegistry *) moduleRegistry;

@end
