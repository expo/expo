// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMUtilities.h>

#import <EXPermissions/EXPermissions.h>

#import <EXPermissions/EXUserNotificationPermissionRequester.h>
#import <EXPermissions/EXRemoteNotificationPermissionRequester.h>

NSString * const EXStatusKey = @"status";
NSString * const EXExpiresKey = @"expires";
NSString * const EXGrantedKey = @"granted";
NSString * const EXCanAskAgain = @"canAskAgain";

NSString * const EXPermissionExpiresNever = @"never";

@interface EXPermissions ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, id<UMPermissionsRequester>> *requesters;
@property (nonatomic, strong) NSMapTable<Class, id<UMPermissionsRequester>> *requestersByClass;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXPermissions

UM_EXPORT_MODULE(ExpoPermissions);

- (instancetype)init
{
  if (self = [super init]) {
    _requesters = [NSMutableDictionary<NSString *, id<UMPermissionsRequester>> new];
    _requestersByClass = [NSMapTable<Class, id<UMPermissionsRequester>> new];
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMPermissionsInterface)];
}

- (void)registerRequesters:(NSArray<id<UMPermissionsRequester>> *)newRequesters {
  for (id<UMPermissionsRequester> requester in newRequesters) {
    [_requesters setObject:requester forKey:[[requester class] permissionType]];
    [_requestersByClass setObject:requester forKey:[requester class]];
  }
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  
  id<UMPermissionsRequester> userNotificationRequester = [[EXUserNotificationPermissionRequester alloc] initWithNotificationProxy:[moduleRegistry getModuleImplementingProtocol:@protocol(UMUserNotificationCenterProxyInterface)] withMethodQueue:self.methodQueue];
  id<UMPermissionsRequester> remoteNotificationRequester = [[EXRemoteNotificationPermissionRequester alloc] initWithUserNotificationPermissionRequester:userNotificationRequester withMethodQueue:self.methodQueue];

  [self registerRequesters:@[userNotificationRequester, remoteNotificationRequester]];
}

# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(getAsync,
                    getPermissionWithType:(NSString *)permissionType
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [self getPermissionUsingRequesterClass:[requester class]
                                 resolve:resolve
                                  reject:reject];
}

UM_EXPORT_METHOD_AS(askAsync,
                    askAsyncForPermission:(NSString *)permissionType
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [self askForPermissionUsingRequesterClass:[requester class]
                                    resolve:resolve
                                     reject:reject];
}

# pragma mark - permission requsters / getters


- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                                 resolve:(UMPromiseResolveBlock)resolve
                                  reject:(UMPromiseRejectBlock)reject
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
  return [self getPermissionUsingRequester:_requesters[type]];
}

- (NSDictionary *)getPermissionUsingRequester:(id<UMPermissionsRequester>)requester
{
  if (requester) {
    return [EXPermissions parsePermissionFromRequester:[requester getPermissions]];
  }
  return nil;
}

// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermissionUsingRequesterClass:(Class)requesterClass
{
  NSDictionary *permissions = [self getPermissionUsingRequesterClass:requesterClass];
  if (!permissions) {
    UMLogWarn(@"Permission requester '%@' not found.", NSStringFromClass(requesterClass));
    return false;
  }
  
  return [permissions[EXStatusKey] isEqualToString:@"granted"];
}

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                    resolve:(UMPromiseResolveBlock)onResult
                                     reject:(UMPromiseRejectBlock)reject
{
  NSMutableDictionary *permission = [[self getPermissionUsingRequesterClass:requesterClass] mutableCopy];
  
  // permission type not found - reject immediately
  if (permission == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized requester: %@", NSStringFromClass(requesterClass)], nil);
  }
  
  BOOL isGranted = [EXPermissions statusForPermission:permission] == UMPermissionStatusGranted;
  permission[@"granted"] = @(isGranted);
  
  if (isGranted) {
    return onResult(permission);
  }
  
  [self askForGlobalPermissionUsingRequesterClass:requesterClass withResolver:onResult withRejecter:reject];
}
   
- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                     withResolver:(UMPromiseResolveBlock)resolver
                                     withRejecter:(UMPromiseRejectBlock)reject
{
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForClass:requesterClass];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNSUPPORTED", @"Cannot find requester", nil);
  }
  
  void (^permissionParser)(NSDictionary *) = ^(NSDictionary * permission){
    resolver([EXPermissions parsePermissionFromRequester:permission]);
  };
  
  [requester requestPermissionsWithResolver:permissionParser rejecter:reject];
}


# pragma mark - helpers

+ (NSDictionary *)parsePermissionFromRequester:(NSDictionary *)permission
{
  NSMutableDictionary *parsedPermission = [permission mutableCopy];
  UMPermissionStatus status = (UMPermissionStatus)[permission[EXStatusKey] intValue];
  BOOL isGranted = status == UMPermissionStatusGranted;
  BOOL canAskAgain = status != UMPermissionStatusDenied;
  
  [parsedPermission setValue:[[self class] permissionStringForStatus:status] forKey:EXStatusKey];
  [parsedPermission setValue:EXPermissionExpiresNever forKey:EXExpiresKey];
  [parsedPermission setValue:@(isGranted) forKey:EXGrantedKey];
  [parsedPermission setValue:@(canAskAgain) forKey:EXCanAskAgain];
  return parsedPermission;
}

+ (NSString *)permissionStringForStatus:(UMPermissionStatus)status
{
  switch (status) {
    case UMPermissionStatusGranted:
      return @"granted";
    case UMPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (UMPermissionStatus)statusForPermission:(NSDictionary *)permission
{
  NSString *status = permission[EXStatusKey];
  if ([status isEqualToString:@"granted"]) {
    return UMPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return UMPermissionStatusDenied;
  } else {
    return UMPermissionStatusUndetermined;
  }
}

- (id<UMPermissionsRequester>)getPermissionRequesterForType:(NSString *)type
{
  return _requesters[type];
}

- (id<UMPermissionsRequester>)getPermissionRequesterForClass:(Class)requesterClass
{
  return [_requestersByClass objectForKey:requesterClass];
}

- (UMModuleRegistry *)getModuleRegistry {
  return _moduleRegistry;
}

@end

