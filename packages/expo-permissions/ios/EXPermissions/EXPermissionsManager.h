// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissions.h>
#import <UMCore/UMSingletonModule.h>

@interface EXPermissionsManager : UMSingletonModule <EXPermissionsScopedModuleDelegate>

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
