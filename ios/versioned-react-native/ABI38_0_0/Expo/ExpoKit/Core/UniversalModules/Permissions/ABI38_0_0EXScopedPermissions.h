// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXPermissions/ABI38_0_0EXPermissions.h>)
#import <UIKit/UIKit.h>
#import <ABI38_0_0EXPermissions/ABI38_0_0EXPermissions.h>
#import "ABI38_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI38_0_0EXPermissionsScopedModuleDelegate

- (ABI38_0_0UMPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI38_0_0EXScopedPermissions : ABI38_0_0EXPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI38_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
