// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXPermissions/ABI35_0_0EXPermissions.h>

FOUNDATION_EXPORT NSString * const ABI35_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI35_0_0EXRemoteNotificationRequester : NSObject <ABI35_0_0EXPermissionRequester, ABI35_0_0EXPermissionRequesterDelegate>

- (instancetype)initWithModuleRegistry: (ABI35_0_0UMModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry;

@end
