// Copyright 2019-present 650 Industries. All rights reserved.

#import "EXPermissionsManager.h"
#import "EXEnvironment.h"

NSString * const EXPermissionsKey = @"ExpoPermissions";

@interface EXPermissionsManager ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, NSDictionary *> *permissionsCache;

@end

@implementation EXPermissionsManager

- (instancetype)init
{
  if (self = [super init]) {
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    NSDictionary *expoPermissions = [userDefaults dictionaryForKey:EXPermissionsKey];
    _permissionsCache = expoPermissions ? [[NSMutableDictionary alloc] initWithDictionary:expoPermissions] : [NSMutableDictionary new];
  }
  return self;
}

UM_REGISTER_SINGLETON_MODULE(Permissions)

- (EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)experienceId
{
  NSString *experienceIdKey = [EXPermissionsManager escapedResourceName:experienceId];
  NSDictionary *experiencePermissions = _permissionsCache[experienceIdKey];
  if (!experiencePermissions) {
    return EXPermissionStatusUndetermined;
  }

  NSDictionary *permissionData = experiencePermissions[permissionType];
  if (!permissionData) {
    return EXPermissionStatusUndetermined;
  }

  if ([permissionData[@"status"] isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusGranted]]) {
    return EXPermissionStatusGranted;
  }

  return EXPermissionStatusDenied;
}

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)experienceId
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return YES;
  }

  return [self getPermission:permission forExperience:experienceId] == EXPermissionStatusGranted;
}

- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)experienceId
{
  NSString *experienceIdKey = [EXPermissionsManager escapedResourceName:experienceId];
  NSMutableDictionary *experiencePermissions;
  if ([_permissionsCache objectForKey:experienceIdKey] == nil) {
    experiencePermissions = [[NSMutableDictionary alloc] init];
  } else {
    experiencePermissions = [[NSMutableDictionary alloc] initWithDictionary:_permissionsCache[experienceIdKey]];
  }

  experiencePermissions[type] = permission;
  _permissionsCache[experienceIdKey] = experiencePermissions;
  [self synchronizeWithPermissions:_permissionsCache];
  return YES;
}

- (void)synchronizeWithPermissions:(NSDictionary *)permissions
{
  [[NSUserDefaults standardUserDefaults] setObject:permissions forKey:EXPermissionsKey];
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

@end


