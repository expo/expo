// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXPermissions/ABI32_0_0EXPermissions.h>

FOUNDATION_EXPORT NSString * const ABI32_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI32_0_0EXRemoteNotificationRequester : NSObject <ABI32_0_0EXPermissionRequester, ABI32_0_0EXPermissionRequesterDelegate>

- (instancetype)initWithModuleRegistry: (ABI32_0_0EXModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry;

@end
