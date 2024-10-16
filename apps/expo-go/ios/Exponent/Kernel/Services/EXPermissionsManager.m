// Copyright 2019-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXPermissionsService.h>

#import "EXPermissionsManager.h"

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

EX_REGISTER_SINGLETON_MODULE(Permissions)

- (EXPermissionStatus)getPermission:(NSString *)permissionType forExperience:(NSString *)scopeKey
{
  permissionType = [EXPermissionsManager mapPermissionType:permissionType];

  NSString *scopeKeyKey = [EXPermissionsManager escapedResourceName:scopeKey];
  NSDictionary *experiencePermissions = _permissionsCache[scopeKeyKey];
  if (!experiencePermissions) {
    return EXPermissionStatusUndetermined;
  }

  NSDictionary *permissionData = experiencePermissions[permissionType];
  if (!permissionData) {
    return EXPermissionStatusUndetermined;
  }

  if ([permissionData[@"status"] isEqualToString:[EXPermissionsService permissionStringForStatus:EXPermissionStatusGranted]]) {
    return EXPermissionStatusGranted;
  }

  return EXPermissionStatusDenied;
}

- (BOOL)hasGrantedPermission:(NSString *)permission forExperience:(NSString *)scopeKey
{  
  return [self getPermission:[EXPermissionsManager mapPermissionType:permission] forExperience:scopeKey] == EXPermissionStatusGranted;
}

- (BOOL)savePermission:(NSDictionary *)permission ofType:(NSString *)type forExperience:(NSString *)scopeKey
{
  type = [EXPermissionsManager mapPermissionType:type];
  
  NSString *scopeKeyKey = [EXPermissionsManager escapedResourceName:scopeKey];
  NSMutableDictionary *experiencePermissions;
  if ([_permissionsCache objectForKey:scopeKeyKey] == nil) {
    experiencePermissions = [[NSMutableDictionary alloc] init];
  } else {
    experiencePermissions = [[NSMutableDictionary alloc] initWithDictionary:_permissionsCache[scopeKeyKey]];
  }

  experiencePermissions[type] = permission;
  _permissionsCache[scopeKeyKey] = experiencePermissions;
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

+ (NSString *)mapPermissionType:(NSString *)type
{
  if ([type isEqual:@"locationForeground"]) {
    return @"location";
  }
  
  return type;
}

@end
