// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMUtilitiesInterface.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMUtilities.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXCalendarRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXCameraPermissionRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXContactsRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXLocationRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXPermissions.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXUserNotificationRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXRemindersRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXRemoteNotificationRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXCameraRollRequester.h>
#import <ABI34_0_0EXPermissions/ABI34_0_0EXSystemBrightnessRequester.h>

NSString * const ABI34_0_0EXPermissionExpiresNever = @"never";

@interface ABI34_0_0EXPermissions ()

@property (nonatomic, strong) NSDictionary<NSString *, Class> *requesters;
@property (nonatomic, strong) NSMutableArray *requests;
@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI34_0_0EXPermissions

ABI34_0_0UM_EXPORT_MODULE(ExpoPermissions);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI34_0_0UMPermissionsInterface), @protocol(ABI34_0_0EXPermissionsModule)];
}

+ (NSDictionary<NSString *, Class> *)defaultRequesters
{
  return @{
           @"audioRecording": [ABI34_0_0EXAudioRecordingPermissionRequester class],
           @"calendar": [ABI34_0_0EXCalendarRequester class],
           @"camera": [ABI34_0_0EXCameraPermissionRequester class],
           @"cameraRoll": [ABI34_0_0EXCameraRollRequester class],
           @"contacts": [ABI34_0_0EXContactsRequester class],
           @"location": [ABI34_0_0EXLocationRequester class],
           @"notifications": [ABI34_0_0EXRemoteNotificationRequester class],
           @"reminders": [ABI34_0_0EXRemindersRequester class],
           @"userFacingNotifications": [ABI34_0_0EXUserNotificationRequester class],
           @"systemBrightness": [ABI34_0_0EXSystemBrightnessRequester class]
           };
}

- (instancetype)init
{
  return [self initWithRequesters:[ABI34_0_0EXPermissions defaultRequesters]];
}

- (instancetype)initWithRequesters:(NSDictionary <NSString *, Class> *)requesters
{
  if (self = [super init]) {
    _requests = [NSMutableArray array];
    _requesters = requesters;
  }
  return self;
}

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

# pragma mark - Exported methods

ABI34_0_0UM_EXPORT_METHOD_AS(getAsync,
                    getPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  NSMutableDictionary *permissions = [NSMutableDictionary new];
  for (NSString *permissionType in permissionsTypes) {
    NSMutableDictionary *permission = [NSMutableDictionary dictionaryWithDictionary:[self getPermissionsForResource:permissionType]];
    // permission type not found - reject immediately
    if (permission == nil) {
      return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
    }

    permissions[permissionType] = permission;
  }
  resolve(permissions);
}

ABI34_0_0UM_EXPORT_METHOD_AS(askAsync,
                    askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [self askForPermissionsWithTypes:permissionsTypes
                       withResults:resolve
                      withRejecter:reject];
}

# pragma mark - permission requsters / getters

- (void)askForGlobalPermissions:(NSArray<NSString *> *)permissionsTypes
                   withResolver:(void (^)(NSDictionary *))resolver
                   withRejecter:(ABI34_0_0UMPromiseRejectBlock)reject
{
  // nothing to ask for - return immediately
  if (permissionsTypes.count == 0) {
    return resolver(@{});
  }

  __block NSMutableDictionary *permissions = [NSMutableDictionary new];
  __block NSMutableSet *permissionsToBeAsked = [NSMutableSet setWithArray:permissionsTypes];
  __block NSString *permissionType; // accumulator for currently proceessed permissionType
  ABI34_0_0UM_WEAKIFY(self);
  
  __block void (^customResolver)(NSDictionary *); // forward declaration
  __block void (^askForNextPermission)(void) = ^() {
    // stop condition: no permission left to be asked - resolve with results
    if (permissionsToBeAsked.count == 0) {
      return resolver(permissions);
    }
  
    ABI34_0_0UM_ENSURE_STRONGIFY(self);
  
    // pop next permissionType from set
    permissionType = [permissionsToBeAsked anyObject];
    [permissionsToBeAsked removeObject:permissionType];
    
    id<ABI34_0_0EXPermissionRequester> requester = [self getPermissionRequesterForType:permissionType];
    
    if (requester == nil) {
      // TODO: other types of permission requesters, e.g. facebook
      reject(@"E_PERMISSIONS_UNSUPPORTED", [NSString stringWithFormat:@"Cannot request permission: %@", permissionType], nil);
      return;
    }

    [self->_requests addObject:requester];
    [requester setDelegate:self];
    [requester requestPermissionsWithResolver:customResolver rejecter:reject];
  };

  customResolver = ^(NSDictionary *permission) {
    ABI34_0_0UM_ENSURE_STRONGIFY(self);
    
    // save results for permission
    BOOL isGranted = [ABI34_0_0EXPermissions statusForPermissions:permission] == ABI34_0_0EXPermissionStatusGranted;
    permissions[permissionType] = [NSMutableDictionary dictionaryWithDictionary:permission];
    permissions[permissionType][@"granted"] = @(isGranted);
    
    askForNextPermission();
  };
  
  // ask for first permission
  askForNextPermission();
}

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

// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermission:(NSString *)permissionType
{
  NSDictionary *permissions = [self getPermissionsForResource:permissionType];

  if (!permissions) {
    ABI34_0_0UMLogWarn(@"Permission with type '%@' not found.", permissionType);
    return false;
  }
  
  return [permissions[@"status"] isEqualToString:@"granted"];
}

- (void)askForPermission:(NSString *)permissionType
              withResult:(void (^)(NSDictionary *))onResult
            withRejecter:(ABI34_0_0UMPromiseRejectBlock)reject
{
  return [self askForPermissions:@[permissionType]
                     withResults:^(NSArray<NSDictionary *> *results) {
                       onResult(results[0]);
                     }
                    withRejecter:reject];
}

- (void)askForPermissions:(NSArray<NSString *> *)permissionsTypes
              withResults:(void (^)(NSArray<NSDictionary *> *))onResults
             withRejecter:(ABI34_0_0UMPromiseRejectBlock)reject
{
  return [self askForPermissionsWithTypes:permissionsTypes
                              withResults:^(NSDictionary *results) {
                                NSMutableArray<NSDictionary *> *finalResults = [NSMutableArray new];

                                [permissionsTypes enumerateObjectsUsingBlock:^(NSString * _Nonnull permissionType, NSUInteger idx, BOOL * _Nonnull stop) {
                                  NSDictionary *result = results[permissionType];
                                  [finalResults addObject:result];
                                }];
                                onResults(finalResults);
                              }
                             withRejecter:reject];
}

- (void)askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                       withResults:(void (^)(NSDictionary *results))onResults
                      withRejecter:(ABI34_0_0UMPromiseRejectBlock)reject
{
  NSMutableArray<NSString *> *globalPermissionsToBeAsked = [NSMutableArray new];
  NSMutableDictionary *permissions = [NSMutableDictionary new];

  for (NSString *permissionType in permissionsTypes) {
    NSMutableDictionary *permission = [[self getPermissionsForResource:permissionType] mutableCopy];
    
    // permission type not found - reject immediately
    if (permission == nil) {
      return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
    }

    BOOL isGranted = [ABI34_0_0EXPermissions statusForPermissions:permission] == ABI34_0_0EXPermissionStatusGranted;
    permission[@"granted"] = @(isGranted);

    if (isGranted) {
      permissions[permissionType] = permission;
    } else {
      [globalPermissionsToBeAsked addObject:permissionType];
    }
  }
  
  void (^globalPermissionResolver)(NSDictionary *) = ^(NSDictionary *globalPermissions) {
    [permissions addEntriesFromDictionary:globalPermissions];
    onResults([NSDictionary dictionaryWithDictionary:permissions]);
  };

  [self askForGlobalPermissions:globalPermissionsToBeAsked
                   withResolver:globalPermissionResolver
                   withRejecter:reject];
}

- (id<ABI34_0_0EXPermissionRequester>)getPermissionRequesterForType:(NSString *)type
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

+ (NSString *)permissionStringForStatus:(ABI34_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI34_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI34_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (ABI34_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions
{
  NSString *status = permissions[@"status"];
  if ([status isEqualToString:@"granted"]) {
    return ABI34_0_0EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return ABI34_0_0EXPermissionStatusDenied;
  } else {
    return ABI34_0_0EXPermissionStatusUndetermined;
  }
}

- (void)permissionRequesterDidFinish:(NSObject<ABI34_0_0EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
