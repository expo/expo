// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXPermissions.h"

@interface EXPermissionsManager : NSObject <EXPermissionsScopedModuleDelegate>

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId;
- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId;

@end
