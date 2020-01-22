// Copyright 2019-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI33_0_0EXPermissions/ABI33_0_0EXPermissions.h>
#import <ABI33_0_0ExpoKit/ABI33_0_0EXConstantsBinding.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI33_0_0EXPermissionsScopedModuleDelegate

- (ABI33_0_0EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId DEPRECATED_ATTRIBUTE; // used in SDKs 29–32
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI33_0_0EXScopedPermissions : ABI33_0_0EXPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI33_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
