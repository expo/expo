// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXUtilitiesInterface.h>
#import <ExpoModulesCore/EXUtilities.h>
#import <ExpoModulesCore/EXPermissionsService.h>

NSString * const EXStatusKey = @"status";
NSString * const EXExpiresKey = @"expires";
NSString * const EXGrantedKey = @"granted";
NSString * const EXCanAskAgain = @"canAskAgain";

NSString * const EXPermissionExpiresNever = @"never";

@interface EXPermissionsService ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, id<EXPermissionsRequester>> *requesters;
@property (nonatomic, strong) NSMapTable<Class, id<EXPermissionsRequester>> *requestersByClass;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXPermissionsService

EX_EXPORT_MODULE();

- (instancetype)init
{
  if (self = [super init]) {
    _requesters = [NSMutableDictionary<NSString *, id<EXPermissionsRequester>> new];
    _requestersByClass = [NSMapTable<Class, id<EXPermissionsRequester>> new];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXPermissionsInterface)];
}

- (void)registerRequesters:(NSArray<id<EXPermissionsRequester>> *)newRequesters {
  for (id<EXPermissionsRequester> requester in newRequesters) {
    [_requesters setObject:requester forKey:[[requester class] permissionType]];
    [_requestersByClass setObject:requester forKey:[requester class]];
  }
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

# pragma mark - permission requsters / getters


- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(EXPromiseResolveBlock)resolve
                                  reject:(EXPromiseRejectBlock)reject
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

- (NSDictionary *)getPermissionUsingRequester:(id<EXPermissionsRequester>)requester
{
  if (requester) {
    return [EXPermissionsService parsePermissionFromRequester:[requester getPermissions]];
  }
  return nil;
}

// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass
{
  NSDictionary *permissions = [self getPermissionUsingRequesterClass:requesterClass];
  if (!permissions) {
    EXLogWarn(@"Permission requester '%@' not found.", NSStringFromClass(requesterClass));
    return false;
  }
  
  return [permissions[EXStatusKey] isEqualToString:@"granted"];
}

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(EXPromiseResolveBlock)onResult
                                     reject:(EXPromiseRejectBlock)reject
{
  NSMutableDictionary *permission = [[self getPermissionUsingRequesterClass:requesterClass] mutableCopy];
  
  // permission type not found - reject immediately
  if (permission == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized requester: %@", NSStringFromClass(requesterClass)], nil);
  }
  
  BOOL isGranted = [EXPermissionsService statusForPermission:permission] == EXPermissionStatusGranted;
  permission[@"granted"] = @(isGranted);
  
  if (isGranted) {
    return onResult(permission);
  }
  
  [self askForGlobalPermissionUsingRequesterClass:requesterClass withResolver:onResult withRejecter:reject];
}
   
- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                     withResolver:(EXPromiseResolveBlock)resolver
                                     withRejecter:(EXPromiseRejectBlock)reject
{
  id<EXPermissionsRequester> requester = [self getPermissionRequesterForClass:requesterClass];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNSUPPORTED", @"Cannot find requester", nil);
  }
  
  void (^permissionParser)(NSDictionary *) = ^(NSDictionary * permission){
    resolver([EXPermissionsService parsePermissionFromRequester:permission]);
  };
  
  [requester requestPermissionsWithResolver:permissionParser rejecter:reject];
}


# pragma mark - helpers

+ (NSDictionary *)parsePermissionFromRequester:(NSDictionary *)permission
{
  NSMutableDictionary *parsedPermission = [permission mutableCopy];
  EXPermissionStatus status = (EXPermissionStatus)[permission[EXStatusKey] intValue];
  BOOL isGranted = status == EXPermissionStatusGranted;
  BOOL canAskAgain = status != EXPermissionStatusDenied;
  
  [parsedPermission setValue:[[self class] permissionStringForStatus:status] forKey:EXStatusKey];
  [parsedPermission setValue:EXPermissionExpiresNever forKey:EXExpiresKey];
  [parsedPermission setValue:@(isGranted) forKey:EXGrantedKey];
  [parsedPermission setValue:@(canAskAgain) forKey:EXCanAskAgain];
  return parsedPermission;
}

+ (NSString *)permissionStringForStatus:(EXPermissionStatus)status
{
  switch (status) {
    case EXPermissionStatusGranted:
      return @"granted";
    case EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (EXPermissionStatus)statusForPermission:(NSDictionary *)permission
{
  NSString *status = permission[EXStatusKey];
  if ([status isEqualToString:@"granted"]) {
    return EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return EXPermissionStatusDenied;
  } else {
    return EXPermissionStatusUndetermined;
  }
}

- (id<EXPermissionsRequester>)getPermissionRequesterForType:(NSString *)type
{
  return _requesters[type];
}

- (id<EXPermissionsRequester>)getPermissionRequesterForClass:(Class)requesterClass
{
  return [_requestersByClass objectForKey:requesterClass];
}

@end

