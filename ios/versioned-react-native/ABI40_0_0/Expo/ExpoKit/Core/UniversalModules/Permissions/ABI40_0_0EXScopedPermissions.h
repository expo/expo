// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXPermissions/ABI40_0_0EXPermissions.h>)
#import <UIKit/UIKit.h>
#import <ABI40_0_0EXPermissions/ABI40_0_0EXPermissions.h>
#import "ABI40_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI40_0_0EXPermissionsScopedModuleDelegate

- (ABI40_0_0UMPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI40_0_0EXScopedPermissions : ABI40_0_0EXPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI40_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
