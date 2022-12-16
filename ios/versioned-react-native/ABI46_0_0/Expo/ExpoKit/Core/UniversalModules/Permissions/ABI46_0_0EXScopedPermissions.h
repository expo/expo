// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI46_0_0ExpoModulesCore/ABI46_0_0EXPermissionsService.h>)
#import <UIKit/UIKit.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXPermissionsService.h>
#import "ABI46_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI46_0_0EXPermissionsScopedModuleDelegate

- (ABI46_0_0EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)scopeKey;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)scopeKey;

@end

@interface ABI46_0_0EXScopedPermissions : ABI46_0_0EXPermissionsService

- (instancetype)initWithScopeKey:(NSString *)scopeKey andConstantsBinding:(ABI46_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
