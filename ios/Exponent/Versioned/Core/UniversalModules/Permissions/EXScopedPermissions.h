// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<UMReactNativeAdapter/EXPermissionsService.h>)
#import <UIKit/UIKit.h>
#import <UMReactNativeAdapter/EXPermissionsService.h>
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXPermissionsScopedModuleDelegate

- (UMPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface EXScopedPermissions : EXPermissionsService

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
