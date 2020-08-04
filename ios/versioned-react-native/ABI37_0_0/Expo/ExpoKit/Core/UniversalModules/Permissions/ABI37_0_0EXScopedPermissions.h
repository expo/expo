// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI37_0_0EXPermissions/ABI37_0_0EXPermissions.h>)
#import <UIKit/UIKit.h>
#import <ABI37_0_0EXPermissions/ABI37_0_0EXPermissions.h>
#import "ABI37_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI37_0_0EXPermissionsScopedModuleDelegate

- (ABI37_0_0UMPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI37_0_0EXScopedPermissions : ABI37_0_0EXPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI37_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
