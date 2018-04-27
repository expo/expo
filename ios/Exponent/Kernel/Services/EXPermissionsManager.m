// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXShellManager.h"
#import "EXPermissionsManager.h"
#import "EXUtil.h"

NSString * const kEXPermissionsKey = @"ExpoPermissions";

@implementation EXPermissionsManager

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId
{
  if ([EXShellManager sharedInstance].isShell) {
    return YES;
  }
  
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *expoPermissions = [userDefaults dictionaryForKey:kEXPermissionsKey];
  if (expoPermissions == nil) {
    return NO;
  }

  NSString *experienceIdKey = [EXUtil escapedResourceName:experienceId];
  NSDictionary *experiencePermissions = expoPermissions[experienceIdKey];
  if (experiencePermissions == nil) {
    return NO;
  }
  
  NSDictionary *permissionData = experiencePermissions[permission];
  return permissionData != nil && [(NSString *)permissionData[@"status"] isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusGranted]];
  
}

- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId
{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  NSMutableDictionary *expoPermissions;
  if ([userDefaults objectForKey:kEXPermissionsKey] == nil) {
    expoPermissions = [[NSMutableDictionary alloc] init];
  } else {
    expoPermissions = [[NSMutableDictionary alloc] initWithDictionary:[userDefaults dictionaryForKey:kEXPermissionsKey]];
  }
  
  NSString *experienceIdKey = [EXUtil escapedResourceName:experienceId];
  NSMutableDictionary *experiencePermissions;
  if ([expoPermissions objectForKey:experienceIdKey] == nil) {
    experiencePermissions = [[NSMutableDictionary alloc] init];
  } else {
    experiencePermissions = [[NSMutableDictionary alloc] initWithDictionary:expoPermissions[experienceIdKey]];
  }
  
  experiencePermissions[type] = permission;
  expoPermissions[experienceIdKey] = experiencePermissions;
  [userDefaults setObject:expoPermissions forKey:kEXPermissionsKey];
  return [userDefaults synchronize];
}

@end


