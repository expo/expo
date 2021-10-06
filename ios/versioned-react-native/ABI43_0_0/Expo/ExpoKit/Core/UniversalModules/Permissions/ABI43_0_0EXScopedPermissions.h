// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ExpoModulesCore/ABI43_0_0EXPermissionsService.h>)
#import <UIKit/UIKit.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsService.h>
#import "ABI43_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI43_0_0EXPermissionsScopedModuleDelegate

- (ABI43_0_0EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)scopeKey;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)scopeKey;

@end

@interface ABI43_0_0EXScopedPermissions : ABI43_0_0EXPermissionsService

- (instancetype)initWithScopeKey:(NSString *)scopeKey andConstantsBinding:(ABI43_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
