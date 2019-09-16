// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMUtilities.h>

#import <EXPermissions/EXPermissions.h>

#import <EXPermissions/EXUserNotificationRequester.h>

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
  
  id<UMPermissionsRequester> userNotificationRequester = [[EXUserNotificationRequester alloc] initWithNotificationProxy:[moduleRegistry  getModuleImplementingProtocol:@protocol(UMUserNotificationCenterProxyInterface)] withMetodQueqe:self.methodQueue];

  [self registerRequesters:@[userNotificationRequester]];
}

# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(getAsync,
                    getPermissionsWithTypes:(NSString *)permissionType
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  [self getPermissionUsingRequesterClass:[requester class]
                              withResult:resolve
                            withRejecter:reject];
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
                                 withResult:resolve
                               withRejecter:reject];
}

# pragma mark - permission requsters / getters


- (void)getPermissionUsingRequesterClass:(Class)requesterClass
                              withResult:(UMPromiseResolveBlock)onResult
                            withRejecter:(UMPromiseRejectBlock)reject
{
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForClass:requesterClass];
  if (requester == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized requester: %@", NSStringFromClass(requesterClass)], nil);
  }
  
  return onResult([self getPermissionUsingRequester:requester]);
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
  
  return [permissions[@"status"] isEqualToString:@"granted"];
}

- (void)askForPermissionUsingRequesterClass:(Class)requesterClass
                                 withResult:(UMPromiseResolveBlock)onResult
                               withRejecter:(UMPromiseRejectBlock)reject
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
  
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForClass:requesterClass];
  [self askForGlobalPermissionUsingRequester:requester withResolver:onResult withRejecter:reject];
}
   
- (void)askForGlobalPermissionUsingRequesterClass:(Class)requesterClass
                                     withResolver:(UMPromiseResolveBlock)resolver
                                     withRejecter:(UMPromiseRejectBlock)reject
{
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForClass:requesterClass];
  [self askForGlobalPermissionUsingRequester:requester withResolver:resolver withRejecter:reject];
}

- (void)askForGlobalPermissionUsingRequester:(id<UMPermissionsRequester>)requester
                                withResolver:(UMPromiseResolveBlock)resolver
                                withRejecter:(UMPromiseRejectBlock)reject
{
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
  UMPermissionStatus status = (UMPermissionStatus)[permission[@"status"] intValue];
  BOOL granted = status == UMPermissionStatusGranted;
  [parsedPermission setValue:[[self class] permissionStringForStatus:status] forKey:@"status"];
  [parsedPermission setValue:EXPermissionExpiresNever forKey:@"expires"];
  [parsedPermission setValue:@(granted) forKey:@"granted"];
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

+ (UMPermissionStatus)statusForPermission:(NSDictionary *)permissions
{
  NSString *status = permissions[@"status"];
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

