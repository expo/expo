// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMUtilities.h>

#import <EXPermissions/EXPermissions.h>

#import <EXPermissions/EXAudioRecordingRequester.h>
#import <EXPermissions/EXSystemBrightnessRequester.h>
#import <EXPermissions/EXCalendarRequester.h>
#import <EXPermissions/EXCameraRequester.h>
#import <EXPermissions/EXCameraRollRequester.h>
#import <EXPermissions/EXContactsRequester.h>
#import <EXPermissions/EXLocationRequester.h>
#import <EXPermissions/EXRemindersRequester.h>
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
    return self;
  }
  return nil;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMPermissionsInterface)];
}

- (void)registerRequesters:(NSSet<id<UMPermissionsRequester>> *)newRequesters {
  for (id<UMPermissionsRequester> requester in newRequesters) {
    [_requesters setObject:requester forKey:[[requester class] permissionType]];
    [_requestersByClass setObject:requester forKey:[requester class]];
  }
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  
// only for test purpose
  NSSet *requesters = [NSSet setWithArray:@[ [EXAudioRecordingRequester new], [EXSystemBrightnessRequester new], [EXCalendarRequester new], [EXCameraRequester new], [EXCameraRollRequester new], [EXContactsRequester new], [EXLocationRequester new], [EXRemindersRequester new],
      [[EXUserNotificationRequester alloc] initWithNotificationProxy:[moduleRegistry  getModuleImplementingProtocol:@protocol(UMUserNotificationCenterProxyInterface)] withMetodQueqe:self.methodQueue] ]];
  
  [self registerRequesters:requesters];
}

# pragma mark - Exported methods

UM_EXPORT_METHOD_AS(getAsync,
                    getPermissionsWithTypes:(NSString *)permissionType
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSMutableDictionary *permission = [NSMutableDictionary dictionaryWithDictionary:[self getPermissionsForResource:permissionType]];
  // permission type not found - reject immediately
  if (permission == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
  resolve(permission);
}

UM_EXPORT_METHOD_AS(askAsync,
                    askAsyncForPermission:(NSString *)permissionType
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [self askForPermissionWithType:permissionType
                     withResults:resolve 
                     withRejecter:reject];
}

# pragma mark - permission requsters / getters

- (NSDictionary *)getPermissionWithRequesterClass:(Class)requesterClass
{
  return [self getPermissionWithRequester:[self getPermissionRequesterForClass:requesterClass]];
}

- (NSDictionary *)getPermissionsForResource:(NSString *)type
{
  return [self getPermissionWithRequester:_requesters[type]];
}

- (NSDictionary *)getPermissionWithRequester:(id<UMPermissionsRequester>)requester
{
  if (requester) {
    return [EXPermissions parsePermissionFromRequester:[requester getPermissions]];
  }
  return nil;
}

// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermissionWithRequesterClass:(Class)requesterClass
{
  NSDictionary *permissions = [self getPermissionWithRequesterClass:requesterClass];
  if (!permissions) {
    UMLogWarn(@"Permission requester '%@' not found.", NSStringFromClass(requesterClass));
    return false;
  }
  
  return [permissions[@"status"] isEqualToString:@"granted"];
}

// From UMPermissionsInterface - use to check permission from code
// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermission:(NSString *)permissionType
{
  NSDictionary *permissions = [self getPermissionsForResource:permissionType];
  if (!permissions) {
    UMLogWarn(@"Permission with type '%@' not found.", permissionType);
    return false;
  }
  
  return [permissions[@"status"] isEqualToString:@"granted"];
}

- (void)askForPermissionWithRequesterClass:(Class)requesterClass
                                withResult:(void (^)(NSDictionary *))onResult
                              withRejecter:(UMPromiseRejectBlock)reject
{
  NSMutableDictionary *permission = [[self getPermissionWithRequesterClass:requesterClass] mutableCopy];
  
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
  [self askForGlobalPermissionWithRequester:requester withResolver:onResult withRejecter:reject];
}

- (void)askForPermissionWithType:(NSString *)permissionType
                       withResults:(void (^)(NSDictionary *results))onResults
                      withRejecter:(UMPromiseRejectBlock)reject
{
  NSMutableDictionary *permission = [[self getPermissionsForResource:permissionType] mutableCopy];
    
  // permission type not found - reject immediately
  if (permission == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
    
  BOOL isGranted = [EXPermissions statusForPermission:permission] == UMPermissionStatusGranted;
  permission[@"granted"] = @(isGranted);
    
  if (isGranted) {
    return onResults(permission);
  }
  
  [self askForGlobalPermission:permissionType
                   withResolver:onResults
                   withRejecter:reject];
}

// From UMPermissionsInterface
- (void)askForPermission:(NSString *)permissionType
              withResult:(void (^)(NSDictionary *))onResult
            withRejecter:(UMPromiseRejectBlock)reject
{
  void (^customResolver)(NSDictionary *) = ^(NSDictionary *permission) {
    NSMutableDictionary *result = [permission mutableCopy];
    BOOL isGranted = [EXPermissions statusForPermission:permission] == UMPermissionStatusGranted;
    result[@"granted"] = @(isGranted);
    onResult(result);
  };
  
  return [self askForPermissionWithType:permissionType
                            withResults:customResolver
                           withRejecter:reject];
}

- (void)askForGlobalPermission:(NSString *)permissionType
                  withResolver:(void (^)(NSDictionary *))resolver
                  withRejecter:(UMPromiseRejectBlock)reject
{
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForType:permissionType];
  [self askForGlobalPermissionWithRequester:requester withResolver:resolver withRejecter:reject];
}

- (void)askForGlobalPermissionWithRequesterClass:(Class)requesterClass
                  withResolver:(void (^)(NSDictionary *))resolver
                  withRejecter:(UMPromiseRejectBlock)reject
{
  id<UMPermissionsRequester> requester = [self getPermissionRequesterForClass:requesterClass];
  [self askForGlobalPermissionWithRequester:requester withResolver:resolver withRejecter:reject];
}

- (void)askForGlobalPermissionWithRequester:(id<UMPermissionsRequester>)requester
                  withResolver:(void (^)(NSDictionary *))resolver
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
  [parsedPermission setValue:[[self class] permissionStringForStatus:status] forKey:@"status"];
  [parsedPermission setValue: EXPermissionExpiresNever forKey:@"expires"];
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
