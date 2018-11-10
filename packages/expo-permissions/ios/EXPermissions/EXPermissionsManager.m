// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXPermissions/EXPermissionsManager.h>
#import <EXPermissions/EXPermissions.h>

NSString * const EXPermissionsKey = @"ExpoPermissions";

@implementation EXPermissionsManager

EX_REGISTER_SINGLETON_MODULE(Permissions)

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId
{
  NSNumber *supportsAppMultiplexing = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"SupportsAppMultiplexing"];
  if (![supportsAppMultiplexing boolValue]) {
    return YES;
  }
  
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *expoPermissions = [userDefaults dictionaryForKey:EXPermissionsKey];
  if (expoPermissions == nil) {
    return NO;
  }

  NSString *experienceIdKey = [EXPermissionsManager escapedResourceName:experienceId];
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
  if ([userDefaults objectForKey:EXPermissionsKey] == nil) {
    expoPermissions = [[NSMutableDictionary alloc] init];
  } else {
    expoPermissions = [[NSMutableDictionary alloc] initWithDictionary:[userDefaults dictionaryForKey:EXPermissionsKey]];
  }
  
  NSString *experienceIdKey = [EXPermissionsManager escapedResourceName:experienceId];
  NSMutableDictionary *experiencePermissions;
  if ([expoPermissions objectForKey:experienceIdKey] == nil) {
    experiencePermissions = [[NSMutableDictionary alloc] init];
  } else {
    experiencePermissions = [[NSMutableDictionary alloc] initWithDictionary:expoPermissions[experienceIdKey]];
  }
  
  experiencePermissions[type] = permission;
  expoPermissions[experienceIdKey] = experiencePermissions;
  [userDefaults setObject:expoPermissions forKey:EXPermissionsKey];
  return [userDefaults synchronize];
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

@end


