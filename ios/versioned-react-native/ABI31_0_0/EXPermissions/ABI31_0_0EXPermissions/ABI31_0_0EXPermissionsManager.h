// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXPermissions/ABI31_0_0EXPermissions.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXSingletonModule.h>

@interface ABI31_0_0EXPermissionsManager : ABI31_0_0EXSingletonModule <ABI31_0_0EXPermissionsScopedModuleDelegate>

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
