// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXPermissions/ABI32_0_0EXPermissions.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXSingletonModule.h>

@interface ABI32_0_0EXPermissionsManager : ABI32_0_0EXSingletonModule <ABI32_0_0EXPermissionsScopedModuleDelegate>

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
