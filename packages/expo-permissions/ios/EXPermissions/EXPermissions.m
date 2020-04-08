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
@property (nonatomic) dispatch_once_t requestersFallbacksRegisteredOnce;

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
  return [self getPermissionUsingRequester:[self getPermissionRequesterForType:type]];
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
  dispatch_once(&_requestersFallbacksRegisteredOnce, ^{
    [self ensureRequestersFallbacksAreRegistered];
  });
  return _requesters[type];
}

- (id<UMPermissionsRequester>)getPermissionRequesterForClass:(Class)requesterClass
{
  return [_requestersByClass objectForKey:requesterClass];
}

- (void)ensureRequestersFallbacksAreRegistered
{
  // TODO: Remove once we promote `expo-notifications` to a stable unimodule (and integrate into Expo client)
  if (!_requesters[@"userFacingNotifications"]) {
    id<UMPermissionsRequester> userNotificationRequester = [[EXUserNotificationPermissionRequester alloc] initWithNotificationProxy:[_moduleRegistry getModuleImplementingProtocol:@protocol(UMUserNotificationCenterProxyInterface)] withMethodQueue:self.methodQueue];
    [self registerRequesters:@[userNotificationRequester]];
  }

  // TODO: Remove once we deprecate and remove "notifications" permission type
  if (!_requesters[@"notifications"] && _requesters[@"userFacingNotifications"]) {
    id<UMPermissionsRequester> remoteNotificationsRequester = [[EXRemoteNotificationPermissionRequester alloc] initWithUserNotificationPermissionRequester:_requesters[@"userFacingNotifications"] withMethodQueue:self.methodQueue];
    [self registerRequesters:@[remoteNotificationsRequester]];
  }
}

@end

