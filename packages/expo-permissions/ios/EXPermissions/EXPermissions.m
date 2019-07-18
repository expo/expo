// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMUtilities.h>
#import <EXPermissions/EXAudioRecordingPermissionRequester.h>
#import <EXPermissions/EXCalendarRequester.h>
#import <EXPermissions/EXCameraPermissionRequester.h>
#import <EXPermissions/EXContactsRequester.h>
#import <EXPermissions/EXLocationRequester.h>
#import <EXPermissions/EXPermissions.h>
#import <EXPermissions/EXUserNotificationRequester.h>
#import <EXPermissions/EXRemindersRequester.h>
#import <EXPermissions/EXRemoteNotificationRequester.h>
#import <EXPermissions/EXCameraRollRequester.h>
#import <EXPermissions/EXSystemBrightnessRequester.h>

NSString * const EXPermissionExpiresNever = @"never";

@interface EXPermissions ()

@property (nonatomic, strong) NSDictionary<NSString *, Class> *requesters;
@property (nonatomic, strong) NSMutableArray *requests;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXPermissions

UM_EXPORT_MODULE(ExpoPermissions);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMPermissionsInterface), @protocol(EXPermissionsModule)];
}

+ (NSDictionary<NSString *, Class> *)defaultRequesters
{
  return @{
           @"audioRecording": [EXAudioRecordingPermissionRequester class],
           @"calendar": [EXCalendarRequester class],
           @"camera": [EXCameraPermissionRequester class],
           @"cameraRoll": [EXCameraRollRequester class],
           @"contacts": [EXContactsRequester class],
           @"location": [EXLocationRequester class],
           @"notifications": [EXRemoteNotificationRequester class],
           @"reminders": [EXRemindersRequester class],
           @"userFacingNotifications": [EXUserNotificationRequester class],
           @"systemBrightness": [EXSystemBrightnessRequester class]
           };
}

- (instancetype)init
{
  return [self initWithRequesters:[EXPermissions defaultRequesters]];
}

- (instancetype)initWithRequesters:(NSDictionary <NSString *, Class> *)requesters
{
  if (self = [super init]) {
    _requests = [NSMutableArray array];
    _requesters = requesters;
  }
  return self;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
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

- (NSDictionary *)getPermissionsForResource:(NSString *)type
{
  Class requesterClass = _requesters[type];
  if (requesterClass) {
    if ([requesterClass respondsToSelector:@selector(permissionsWithModuleRegistry:)]) {
      return [requesterClass permissionsWithModuleRegistry:_moduleRegistry];
    }
    
    return [requesterClass permissions];
  }
  
  return nil;
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

- (void)askForPermissionWithType:(NSString *)permissionType
                       withResults:(void (^)(NSDictionary *results))onResults
                      withRejecter:(UMPromiseRejectBlock)reject
{
  NSMutableDictionary *permission = [[self getPermissionsForResource:permissionType] mutableCopy];
    
  // permission type not found - reject immediately
  if (permission == nil) {
    return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
  }
    
  BOOL isGranted = [EXPermissions statusForPermissions:permission] == EXPermissionStatusGranted;
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
    BOOL isGranted = [EXPermissions statusForPermissions:permission] == EXPermissionStatusGranted;
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
  id<EXPermissionRequester> requester = [self getPermissionRequesterForType:permissionType];
  if (requester == nil) {
    // TODO: other types of permission requesters, e.g. facebook
    return reject(@"E_PERMISSIONS_UNSUPPORTED", [NSString stringWithFormat:@"Cannot request permission: %@", permissionType], nil);
  }
  
  [self.requests addObject:requester];
  [requester setDelegate:self];
  [requester requestPermissionsWithResolver:resolver rejecter:reject];
}

# pragma mark - helpers

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

+ (EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions
{
  NSString *status = permissions[@"status"];
  if ([status isEqualToString:@"granted"]) {
    return EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return EXPermissionStatusDenied;
  } else {
    return EXPermissionStatusUndetermined;
  }
}

- (id<EXPermissionRequester>)getPermissionRequesterForType:(NSString *)type
{
  Class requesterClass = _requesters[type];
  if (requesterClass) {
    if ([requesterClass instancesRespondToSelector:@selector(initWithModuleRegistry:)]) {
      return [[requesterClass alloc] initWithModuleRegistry:_moduleRegistry];
    }
    
    return [[requesterClass alloc] init];
  }
  
  return nil;
}

- (void)permissionRequesterDidFinish:(NSObject<EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}


@end
