// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI34_0_0EXPermissions/ABI34_0_0EXPermissions.h>)
#import <UIKit/UIKit.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXPermissions.h>
#import <ABI34_0_0ExpoKit/ABI34_0_0EXConstantsBinding.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI34_0_0EXPermissionsScopedModuleDelegate

- (ABI34_0_0EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
// TODO: Remove once SDK32 is phased out
- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId; // used in SDKs 29–32
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface ABI34_0_0EXScopedPermissions : ABI34_0_0EXPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(ABI34_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
