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
                    getPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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

UM_EXPORT_METHOD_AS(askAsync,
                    askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [self askForPermissionsWithTypes:permissionsTypes
                       withResults:resolve
                      withRejecter:reject];
}

# pragma mark - permission requsters / getters

- (void)askForGlobalPermissions:(NSArray<NSString *> *)permissionsTypes
                   withResolver:(void (^)(NSDictionary *))resolver
                   withRejecter:(UMPromiseRejectBlock)reject
{
  // nothing to ask for - return immediately
  if (permissionsTypes.count == 0) {
    return resolver(@{});
  }

  __block NSMutableDictionary *permissions = [NSMutableDictionary new];
  __block NSMutableSet *permissionsToBeAsked = [NSMutableSet setWithArray:permissionsTypes];
  __block NSString *permissionType; // accumulator for currently proceessed permissionType
  UM_WEAKIFY(self);
  
  __block void (^customResolver)(NSDictionary *); // forward declaration
  __block void (^askForNextPermission)(void) = ^() {
    // stop condition: no permission left to be asked - resolve with results
    if (permissionsToBeAsked.count == 0) {
      return resolver(permissions);
    }
  
    UM_ENSURE_STRONGIFY(self);
  
    // pop next permissionType from set
    permissionType = [permissionsToBeAsked anyObject];
    [permissionsToBeAsked removeObject:permissionType];
    
    id<EXPermissionRequester> requester = [self getPermissionRequesterForType:permissionType];
    
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
    UM_ENSURE_STRONGIFY(self);
    
    // save results for permission
    permissions[permissionType] = [NSMutableDictionary dictionaryWithDictionary:permission];
    
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
    UMLogWarn(@"Permission with type '%@' not found.", permissionType);
    return false;
  }
  
  return [permissions[@"status"] isEqualToString:@"granted"];
}

- (void)askForPermission:(NSString *)permissionType
              withResult:(void (^)(NSDictionary *))onResult
            withRejecter:(UMPromiseRejectBlock)reject
{
  return [self askForPermissions:@[permissionType]
                     withResults:^(NSArray<NSDictionary *> *results) {
                       onResult(results[0]);
                     }
                    withRejecter:reject];
}

- (void)askForPermissions:(NSArray<NSString *> *)permissionsTypes
              withResults:(void (^)(NSArray<NSDictionary *> *))onResults
             withRejecter:(UMPromiseRejectBlock)reject
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
                      withRejecter:(UMPromiseRejectBlock)reject
{
  NSMutableArray<NSString *> *globalPermissionsToBeAsked = [NSMutableArray new];
  NSMutableDictionary *permissions = [NSMutableDictionary new];

  for (NSString *permissionType in permissionsTypes) {
    NSMutableDictionary *permission = [[self getPermissionsForResource:permissionType] mutableCopy];
    
    // permission type not found - reject immediately
    if (permission == nil) {
      return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
    }

    BOOL isGranted = [EXPermissions statusForPermissions:permission] == EXPermissionStatusGranted;
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

- (void)permissionRequesterDidFinish:(NSObject<EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
