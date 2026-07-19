// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ExpoModulesCore/EXPermissionsService.h>)
#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXPermissionsService.h>
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXPermissionsScopedModuleDelegate

- (EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)scopeKey;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)scopeKey;

@end

@interface EXScopedPermissions : EXPermissionsService

- (instancetype)initWithScopeKey:(NSString *)scopeKey andConstantsBinding:(EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
