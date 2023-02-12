// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUtilitiesInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUtilities.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXPermissionsService.h>

NSString * const ABI46_0_0EXStatusKey = @"status";
NSString * const ABI46_0_0EXExpiresKey = @"expires";
NSString * const ABI46_0_0EXGrantedKey = @"granted";
NSString * const ABI46_0_0EXCanAskAgain = @"canAskAgain";

NSString * const ABI46_0_0EXPermissionExpiresNever = @"never";

@interface ABI46_0_0EXPermissionsService ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, id<ABI46_0_0EXPermissionsRequester>> *requesters;
@property (nonatomic, strong) NSMapTable<Class, id<ABI46_0_0EXPermissionsRequester>> *requestersByClass;
@property (nonatomic, weak) ABI46_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI46_0_0EXPermissionsService

ABI46_0_0EX_EXPORT_MODULE();

- (instancetype)init
{
  if (self = [super init]) {
    _requesters = [NSMutableDictionary<NSString *, id<ABI46_0_0EXPermissionsRequester>> new];
    _requestersByClass = [NSMapTable<Class, id<ABI46_0_0EXPermissionsRequester>> new];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI46_0_0EXPermissionsInterface)];
}

- (void)registerRequesters:(NSArray<id<ABI46_0_0EXPermissionsRequester>> *)newRequesters {
  for (id<ABI46_0_0EXPermissionsRequester> requester in newRequesters) {
    [_requesters setObject:requester forKey:[[requester class] permissionType]];
    [_requestersByClass setObject:requester forKey:[requester class]];
  }
}

- (void)setModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

# pragma mark - permission requsters / getters


- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI46_0_0EXPromiseResolveBlock)resolve
                                  reject:(ABI46_0_0EXPromiseRejectBlock)reject
{
  NSDictionary *permission = [self getPermissionUsingRequesterClass:requesterClass];
  if (permission == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized requester: %@", NSStringFromClass(requesterClass)], nil);
  }
  
  return resolve(permission);
}

- (NSDictionary *)getPermissionUsingRequesterClass:(Class)requesterClass
{
  return [self getPermissionUsingRequester:[self getPermissionRequesterForClass:requesterClass]];
}

- (NSDictionary *)getPermissionsForResource:(NSString *)type
{
  return [self getPermissionUsingRequester:[self getPermissionRequesterForType:type]];
}

- (NSDictionary *)getPermissionUsingRequester:(id<ABI46_0_0EXPermissionsRequester>)requester
{
  if (requester) {
    return [ABI46_0_0EXPermissionsService parsePermissionFromRequester:[requester getPermissions]];
  }
  return nil;
}

// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass
{
  NSDictionary *permissions = [self getPermissionUsingRequesterClass:requesterClass];
  if (!permissions) {
    ABI46_0_0EXLogWarn(@"Permission requester '%@' not found.", NSStringFromClass(requesterClass));
    return false;
  }
  
  return [permissions[ABI46_0_0EXStatusKey] isEqualToString:@"granted"];
}

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI46_0_0EXPromiseResolveBlock)onResult
                                     reject:(ABI46_0_0EXPromiseRejectBlock)reject
{
  NSMutableDictionary *permission = [[self getPermissionUsingRequesterClass:requesterClass] mutableCopy];
  
  // permission type not found - reject immediately
  if (permission == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized requester: %@", NSStringFromClass(requesterClass)], nil);
  }
  
  BOOL isGranted = [ABI46_0_0EXPermissionsService statusForPermission:permission] == ABI46_0_0EXPermissionStatusGranted;
  permission[@"granted"] = @(isGranted);
  
  if (isGranted) {
    return onResult(permission);
  }
  
  [self askForGlobalPermissionUsingRequesterClass:requesterClass withResolver:onResult withRejecter:reject];
}
   
- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                     withResolver:(ABI46_0_0EXPromiseResolveBlock)resolver
                                     withRejecter:(ABI46_0_0EXPromiseRejectBlock)reject
{
  id<ABI46_0_0EXPermissionsRequester> requester = [self getPermissionRequesterForClass:requesterClass];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNSUPPORTED", @"Cannot find requester", nil);
  }
  
  void (^permissionParser)(NSDictionary *) = ^(NSDictionary * permission){
    resolver([ABI46_0_0EXPermissionsService parsePermissionFromRequester:permission]);
  };
  
  [requester requestPermissionsWithResolver:permissionParser rejecter:reject];
}


# pragma mark - helpers

+ (NSDictionary *)parsePermissionFromRequester:(NSDictionary *)permission
{
  NSMutableDictionary *parsedPermission = [permission mutableCopy];
  ABI46_0_0EXPermissionStatus status = (ABI46_0_0EXPermissionStatus)[permission[ABI46_0_0EXStatusKey] intValue];
  BOOL isGranted = status == ABI46_0_0EXPermissionStatusGranted;
  BOOL canAskAgain = status != ABI46_0_0EXPermissionStatusDenied;
  
  [parsedPermission setValue:[[self class] permissionStringForStatus:status] forKey:ABI46_0_0EXStatusKey];
  [parsedPermission setValue:ABI46_0_0EXPermissionExpiresNever forKey:ABI46_0_0EXExpiresKey];
  [parsedPermission setValue:@(isGranted) forKey:ABI46_0_0EXGrantedKey];
  [parsedPermission setValue:@(canAskAgain) forKey:ABI46_0_0EXCanAskAgain];
  return parsedPermission;
}

+ (NSString *)permissionStringForStatus:(ABI46_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI46_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI46_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (ABI46_0_0EXPermissionStatus)statusForPermission:(NSDictionary *)permission
{
  NSString *status = permission[ABI46_0_0EXStatusKey];
  if ([status isEqualToString:@"granted"]) {
    return ABI46_0_0EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return ABI46_0_0EXPermissionStatusDenied;
  } else {
    return ABI46_0_0EXPermissionStatusUndetermined;
  }
}

- (id<ABI46_0_0EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type
{
  return _requesters[type];
}

- (id<ABI46_0_0EXPermissionsRequester>)getPermissionRequesterForClass:(Class)requesterClass
{
  return [_requestersByClass objectForKey:requesterClass];
}

@end

