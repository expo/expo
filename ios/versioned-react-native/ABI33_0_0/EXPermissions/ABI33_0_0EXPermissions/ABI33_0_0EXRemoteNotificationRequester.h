// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXPermissions/ABI33_0_0EXPermissions.h>

FOUNDATION_EXPORT NSString * const ABI33_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI33_0_0EXRemoteNotificationRequester : NSObject <ABI33_0_0EXPermissionRequester, ABI33_0_0EXPermissionRequesterDelegate>

- (instancetype)initWithModuleRegistry: (ABI33_0_0UMModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry;

@end
