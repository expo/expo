// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXPermissions/ABI30_0_0EXPermissionsManager.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXPermissions.h>

NSString * const ABI30_0_0EXPermissionsKey = @"ExpoPermissions";

@implementation ABI30_0_0EXPermissionsManager

ABI30_0_0EX_REGISTER_SINGLETON_MODULE(Permissions)

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId
{
  NSNumber *supportsAppMultiplexing = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"SupportsAppMultiplexing"];
  if (![supportsAppMultiplexing boolValue]) {
    return YES;
  }
  
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *expoPermissions = [userDefaults dictionaryForKey:ABI30_0_0EXPermissionsKey];
  if (expoPermissions == nil) {
    return NO;
  }

  NSString *experienceIdKey = [ABI30_0_0EXPermissionsManager escapedResourceName:experienceId];
  NSDictionary *experiencePermissions = expoPermissions[experienceIdKey];
  if (experiencePermissions == nil) {
    return NO;
  }
  
  NSDictionary *permissionData = experiencePermissions[permission];
  return permissionData != nil && [(NSString *)permissionData[@"status"] isEqualToString:[ABI30_0_0EXPermissions permissionStringForStatus:ABI30_0_0EXPermissionStatusGranted]];
  
}

- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId
{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  NSMutableDictionary *expoPermissions;
  if ([userDefaults objectForKey:ABI30_0_0EXPermissionsKey] == nil) {
    expoPermissions = [[NSMutableDictionary alloc] init];
  } else {
    expoPermissions = [[NSMutableDictionary alloc] initWithDictionary:[userDefaults dictionaryForKey:ABI30_0_0EXPermissionsKey]];
  }
  
  NSString *experienceIdKey = [ABI30_0_0EXPermissionsManager escapedResourceName:experienceId];
  NSMutableDictionary *experiencePermissions;
  if ([expoPermissions objectForKey:experienceIdKey] == nil) {
    experiencePermissions = [[NSMutableDictionary alloc] init];
  } else {
    experiencePermissions = [[NSMutableDictionary alloc] initWithDictionary:expoPermissions[experienceIdKey]];
  }
  
  experiencePermissions[type] = permission;
  expoPermissions[experienceIdKey] = experiencePermissions;
  [userDefaults setObject:expoPermissions forKey:ABI30_0_0EXPermissionsKey];
  return [userDefaults synchronize];
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

@end


