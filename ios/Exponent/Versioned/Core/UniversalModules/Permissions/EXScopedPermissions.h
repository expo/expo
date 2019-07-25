// Copyright 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXPermissions/EXPermissions.h>)
#import <UIKit/UIKit.h>
#import <EXPermissions/EXPermissions.h>
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXPermissionsScopedModuleDelegate

- (EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
// TODO: Remove once SDK32 is phased out
- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId; // used in SDKs 29–32
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface EXScopedPermissions : EXPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
