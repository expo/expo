// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0UMReactNativeAdapter/ABI41_0_0EXPermissionsService.h>)
#import <UIKit/UIKit.h>
#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0EXPermissionsService.h>
#import "ABI41_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol ABI41_0_0EXPermissionsScopedModuleDelegate

- (ABI41_0_0UMPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI41_0_0EXScopedPermissions : ABI41_0_0EXPermissionsService

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI41_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
