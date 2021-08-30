// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMUtilitiesInterface.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0EXPermissionsService.h>

NSString * const ABI41_0_0EXStatusKey = @"status";
NSString * const ABI41_0_0EXExpiresKey = @"expires";
NSString * const ABI41_0_0EXGrantedKey = @"granted";
NSString * const ABI41_0_0EXCanAskAgain = @"canAskAgain";

NSString * const ABI41_0_0EXPermissionExpiresNever = @"never";

@interface ABI41_0_0EXPermissionsService ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, id<ABI41_0_0UMPermissionsRequester>> *requesters;
@property (nonatomic, strong) NSMapTable<Class, id<ABI41_0_0UMPermissionsRequester>> *requestersByClass;
@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI41_0_0EXPermissionsService

ABI41_0_0UM_EXPORT_MODULE();

- (instancetype)init
{
  if (self = [super init]) {
    _requesters = [NSMutableDictionary<NSString *, id<ABI41_0_0UMPermissionsRequester>> new];
    _requestersByClass = [NSMapTable<Class, id<ABI41_0_0UMPermissionsRequester>> new];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI41_0_0UMPermissionsInterface)];
}

- (void)registerRequesters:(NSArray<id<ABI41_0_0UMPermissionsRequester>> *)newRequesters {
  for (id<ABI41_0_0UMPermissionsRequester> requester in newRequesters) {
    [_requesters setObject:requester forKey:[[requester class] permissionType]];
    [_requestersByClass setObject:requester forKey:[requester class]];
  }
}

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

# pragma mark - permission requsters / getters


- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                                  reject:(ABI41_0_0UMPromiseRejectBlock)reject
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

- (NSDictionary *)getPermissionUsingRequester:(id<ABI41_0_0UMPermissionsRequester>)requester
{
  if (requester) {
    return [ABI41_0_0EXPermissionsService parsePermissionFromRequester:[requester getPermissions]];
  }
  return nil;
}

// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass
{
  NSDictionary *permissions = [self getPermissionUsingRequesterClass:requesterClass];
  if (!permissions) {
    ABI41_0_0UMLogWarn(@"Permission requester '%@' not found.", NSStringFromClass(requesterClass));
    return false;
  }
  
  return [permissions[ABI41_0_0EXStatusKey] isEqualToString:@"granted"];
}

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(ABI41_0_0UMPromiseResolveBlock)onResult
                                     reject:(ABI41_0_0UMPromiseRejectBlock)reject
{
  NSMutableDictionary *permission = [[self getPermissionUsingRequesterClass:requesterClass] mutableCopy];
  
  // permission type not found - reject immediately
  if (permission == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized requester: %@", NSStringFromClass(requesterClass)], nil);
  }
  
  BOOL isGranted = [ABI41_0_0EXPermissionsService statusForPermission:permission] == ABI41_0_0UMPermissionStatusGranted;
  permission[@"granted"] = @(isGranted);
  
  if (isGranted) {
    return onResult(permission);
  }
  
  [self askForGlobalPermissionUsingRequesterClass:requesterClass withResolver:onResult withRejecter:reject];
}
   
- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                     withResolver:(ABI41_0_0UMPromiseResolveBlock)resolver
                                     withRejecter:(ABI41_0_0UMPromiseRejectBlock)reject
{
  id<ABI41_0_0UMPermissionsRequester> requester = [self getPermissionRequesterForClass:requesterClass];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNSUPPORTED", @"Cannot find requester", nil);
  }
  
  void (^permissionParser)(NSDictionary *) = ^(NSDictionary * permission){
    resolver([ABI41_0_0EXPermissionsService parsePermissionFromRequester:permission]);
  };
  
  [requester requestPermissionsWithResolver:permissionParser rejecter:reject];
}


# pragma mark - helpers

+ (NSDictionary *)parsePermissionFromRequester:(NSDictionary *)permission
{
  NSMutableDictionary *parsedPermission = [permission mutableCopy];
  ABI41_0_0UMPermissionStatus status = (ABI41_0_0UMPermissionStatus)[permission[ABI41_0_0EXStatusKey] intValue];
  BOOL isGranted = status == ABI41_0_0UMPermissionStatusGranted;
  BOOL canAskAgain = status != ABI41_0_0UMPermissionStatusDenied;
  
  [parsedPermission setValue:[[self class] permissionStringForStatus:status] forKey:ABI41_0_0EXStatusKey];
  [parsedPermission setValue:ABI41_0_0EXPermissionExpiresNever forKey:ABI41_0_0EXExpiresKey];
  [parsedPermission setValue:@(isGranted) forKey:ABI41_0_0EXGrantedKey];
  [parsedPermission setValue:@(canAskAgain) forKey:ABI41_0_0EXCanAskAgain];
  return parsedPermission;
}

+ (NSString *)permissionStringForStatus:(ABI41_0_0UMPermissionStatus)status
{
  switch (status) {
    case ABI41_0_0UMPermissionStatusGranted:
      return @"granted";
    case ABI41_0_0UMPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (ABI41_0_0UMPermissionStatus)statusForPermission:(NSDictionary *)permission
{
  NSString *status = permission[ABI41_0_0EXStatusKey];
  if ([status isEqualToString:@"granted"]) {
    return ABI41_0_0UMPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return ABI41_0_0UMPermissionStatusDenied;
  } else {
    return ABI41_0_0UMPermissionStatusUndetermined;
  }
}

- (id<ABI41_0_0UMPermissionsRequester>)getPermissionRequesterForType:(NSString *)type
{
  return _requesters[type];
}

- (id<ABI41_0_0UMPermissionsRequester>)getPermissionRequesterForClass:(Class)requesterClass
{
  return [_requestersByClass objectForKey:requesterClass];
}

@end

