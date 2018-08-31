// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXPermissions/ABI30_0_0EXPermissions.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXSingletonModule.h>

@interface ABI30_0_0EXPermissionsManager : ABI30_0_0EXSingletonModule <ABI30_0_0EXPermissionsScopedModuleDelegate>

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
