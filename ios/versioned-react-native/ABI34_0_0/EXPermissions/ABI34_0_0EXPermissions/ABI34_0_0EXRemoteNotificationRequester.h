// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXPermissions/ABI34_0_0EXPermissions.h>

FOUNDATION_EXPORT NSString * const ABI34_0_0EXAppDidRegisterForRemoteNotificationsNotificationName;

@interface ABI34_0_0EXRemoteNotificationRequester : NSObject <ABI34_0_0EXPermissionRequester, ABI34_0_0EXPermissionRequesterDelegate>

- (instancetype)initWithModuleRegistry: (ABI34_0_0UMModuleRegistry *)moduleRegistry;

+ (NSDictionary *)permissionsWithModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry;

@end
