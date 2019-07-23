// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>

FOUNDATION_EXPORT NSString * const EXAppDidRegisterForRemoteNotificationsNotificationName;

// todo 
@interface EXRemoteNotificationRequester : NSObject <EXPermissionRequester, EXPermissionRequesterDelegate>

- (instancetype)initWithModuleRegistry: (UMModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(UMModuleRegistry *)moduleRegistry;

@end
