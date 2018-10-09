// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>
#import <EXCore/EXSingletonModule.h>

@interface EXPermissionsManager : EXSingletonModule <EXPermissionsScopedModuleDelegate>

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
