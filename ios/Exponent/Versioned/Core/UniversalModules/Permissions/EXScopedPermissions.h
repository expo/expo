// Copyright 2019-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <EXPermissions/EXPermissions.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXPermissionsScopedModuleDelegate

- (EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId;
- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId DEPRECATED_ATTRIBUTE; // used in SDKs 29–32
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end

@interface EXScopedPermissions : EXPermissions

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
