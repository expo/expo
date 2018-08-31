// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXUtilitiesInterface.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXUtilities.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXCalendarRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXCameraPermissionRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXContactsRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXLocationRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXPermissions.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXLocalNotificationRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXRemindersRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXRemoteNotificationRequester.h>
#import <ABI30_0_0EXPermissions/ABI30_0_0EXCameraRollRequester.h>

NSString * const ABI30_0_0EXPermissionExpiresNever = @"never";

@interface ABI30_0_0EXPermissions ()

@property (nonatomic, strong) NSMutableArray *requests;
@property (nonatomic, weak) id<ABI30_0_0EXPermissionsServiceInterface> permissionsService;
@property (nonatomic, weak) id<ABI30_0_0EXUtilitiesInterface> utils;
@property (nonatomic, assign) NSString *experienceId;

@end

@implementation ABI30_0_0EXPermissions

ABI30_0_0EX_EXPORT_MODULE(ExponentPermissions);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI30_0_0EXPermissionsInterface)];
}

- (NSDictionary *)constantsToExport
{
  return nil;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)init
{
  if (self = [super init]) {
    _requests = [NSMutableArray array];
  }
  return self;
}

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [self init]) {
    _experienceId = experienceId;
  }
  return self;
}

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsService = [moduleRegistry getSingletonModuleForName:@"Permissions"];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXUtilitiesInterface)];
}

# pragma mark - Expo exported methods

ABI30_0_0EX_EXPORT_METHOD_AS(getAsync,
                    getPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  NSMutableDictionary *permissions = [NSMutableDictionary new];
  for (NSString *permissionType in permissionsTypes) {
    NSMutableDictionary *permission = [NSMutableDictionary dictionaryWithDictionary:[self getPermissionsForResource:permissionType]];
    // permission type not found - reject immediately
    if (permission == nil) {
      return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
    }
    
    // check scoped permissions if available
    if (_permissionsService != nil) {
      if (![[self class] isExcludedScopedPermission:permissionType]
          && [permission[@"status"] isEqualToString:[[self class] permissionStringForStatus:ABI30_0_0EXPermissionStatusGranted]]
          && ![_permissionsService hasGrantedPermission:permissionType forExperience:_experienceId])
      {
        permission[@"status"] = [[self class] permissionStringForStatus:ABI30_0_0EXPermissionStatusDenied];
      }
    }
    permissions[permissionType] = permission;
  }
  resolve([NSDictionary dictionaryWithDictionary:permissions]);
}

ABI30_0_0EX_EXPORT_METHOD_AS(askAsync,
                    askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                    resolver:(ABI30_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI30_0_0EXPromiseRejectBlock)reject)
{
  [self askForPermissionsWithTypes:permissionsTypes
                       withResults:resolve
                      withRejecter:reject];
}

# pragma mark - permission requsters / getters

- (void)askForGlobalPermissions:(NSArray<NSString *> *)permissionsTypes
                   withResolver:(void (^)(NSDictionary *))resolver
                   withRejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  // nothing to ask for - return immediately
  if (permissionsTypes.count == 0) {
    return resolver(@{});
  }

  __block NSMutableDictionary *permissions = [NSMutableDictionary new];
  __block NSMutableSet *permissionsToBeAsked = [NSMutableSet setWithArray:permissionsTypes];
  __block NSString *permissionType; // accumulator for currently proceessed permissionType
  ABI30_0_0EX_WEAKIFY(self);
  
  __block void (^customResolver)(NSDictionary *); // forward declaration
  __block void (^askForNextPermission)(void) = ^() {
    // stop condition: no permission left to be asked - resolve with results
    if (permissionsToBeAsked.count == 0) {
      return resolver(permissions);
    }
  
    ABI30_0_0EX_ENSURE_STRONGIFY(self);
  
    // pop next permissionType from set
    permissionType = [permissionsToBeAsked anyObject];
    [permissionsToBeAsked removeObject:permissionType];
    
    id<ABI30_0_0EXPermissionRequester> requester = [[self class] getPermissionRequesterForType:permissionType];
    
    if (requester == nil) {
      // TODO: other types of permission requesters, e.g. facebook
      reject(@"E_PERMISSIONS_UNSUPPORTED", [NSString stringWithFormat:@"Cannot request permission: %@", permissionType], nil);
      return;
    }

    [self->_requests addObject:requester];
    [requester setDelegate:self];
    [requester requestPermissionsWithResolver:customResolver rejecter:reject];
  };
  
  // we need custom resolver for the requester cause we need to save given permissions per experience
  customResolver = ^(NSDictionary *permission) {
    ABI30_0_0EX_ENSURE_STRONGIFY(self);
    
    // save results for permission
    permissions[permissionType] = [NSMutableDictionary dictionaryWithDictionary:permission];
    
    // check if save scoped permissions & singal possible failure by marking permission as denied
    if (self.permissionsService != nil
        && ![[self class] isExcludedScopedPermission:permissionType]
        && ![self.permissionsService savePermission:permission
                                             ofType:permissionType
                                      forExperience:self.experienceId])
    {
      permissions[permissionType][@"status"] = [[self class] permissionStringForStatus:ABI30_0_0EXPermissionStatusDenied];
    }
    
    askForNextPermission();
  };
  
  // ask for first permission
  askForNextPermission();
}

- (void)askForScopedPermissions:(NSArray<NSString *> *)permissionsTypes
                   withResolver:(void (^)(NSDictionary *))resolver
                   withRejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  // nothing to ask for - return immediately
  if (permissionsTypes.count == 0) {
    return resolver(@{});
  }

  __block NSMutableDictionary *permissions = [NSMutableDictionary new];
  __block NSMutableSet *permissionsToBeAsked = [NSMutableSet setWithArray:permissionsTypes];
  __block NSString *permissionType; // accumulator for currently proceessed permissionType
  ABI30_0_0EX_WEAKIFY(self);
  
  __block void (^askForNextPermission)(void) = ^() {
    // stop condition: no permission left to be asked - resolve with results
    if (permissionsToBeAsked.count == 0) {
      resolver(permissions);
      askForNextPermission = nil;
      return;
    }
    
    ABI30_0_0EX_ENSURE_STRONGIFY(self);

    // pop next permissionType from set
    permissionType = [permissionsToBeAsked anyObject];
    [permissionsToBeAsked removeObject:permissionType];

    // initilize as global permission
    permissions[permissionType] = [NSMutableDictionary dictionaryWithDictionary:[self getPermissionsForResource:permissionType]];

    // had to reinitilize UIAlertActions between alertShow invocations
    UIAlertAction *allowAction = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      ABI30_0_0EX_ENSURE_STRONGIFY(self);
      // try to save scoped permissions - if fails than permission is denied
      if (![self.permissionsService savePermission:permissions[permissionType] ofType:permissionType forExperience:self.experienceId]) {
        permissions[permissionType][@"status"] = [[self class] permissionStringForStatus:ABI30_0_0EXPermissionStatusDenied];
      }
      askForNextPermission();
    }];

    UIAlertAction *denyAction = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      ABI30_0_0EX_ENSURE_STRONGIFY(self);
      permissions[permissionType][@"status"] = [[self class] permissionStringForStatus:ABI30_0_0EXPermissionStatusDenied];
      askForNextPermission();
    }];

    [self showPermissionRequestAlert:permissionType withAllowAction:allowAction withDenyAction:denyAction];
  };

  // ask for first scoped permission
  askForNextPermission();
}

- (void)showPermissionRequestAlert:(NSString *)permissionType
                   withAllowAction:(UIAlertAction *)allow
                    withDenyAction:(UIAlertAction *)deny
{
  NSString *experienceName = self.experienceId; // TODO: we might want to use name from the manifest?
  NSString *messageTemplate = @"%1$@ needs permissions for %2$@. You\'ve already granted permission to another Expo experience. Allow %1$@ to use it also?";
  NSString *permissionString = [[self class] textForPermissionType:permissionType];
  
  NSString *message = [NSString stringWithFormat:messageTemplate, experienceName, permissionString];
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Experience needs permissions"
                                                                 message:message
                                                          preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:deny];
  [alert addAction:allow];

  ABI30_0_0EX_WEAKIFY(self);
  [ABI30_0_0EXUtilities performSynchronouslyOnMainThread:^{
    ABI30_0_0EX_ENSURE_STRONGIFY(self);
    // TODO: below line is sometimes failing with: "Presenting view controllers on detached view controllers is discourage"
    [self->_utils.currentViewController presentViewController:alert animated:YES completion:nil];
  }];
}

+ (NSDictionary *)alwaysGrantedPermissions {
  return @{
           @"status": [ABI30_0_0EXPermissions permissionStringForStatus:ABI30_0_0EXPermissionStatusGranted],
           @"expires": ABI30_0_0EXPermissionExpiresNever,
           };
}

- (NSDictionary *)getPermissionsForResource:(NSString *)type
{
  if ([type isEqualToString:@"notifications"]) {
    return [ABI30_0_0EXRemoteNotificationRequester permissions];
  } else if ([type isEqualToString:@"userFacingNotifications"]) {
    return [ABI30_0_0EXLocalNotificationRequester permissions];
  } else if ([type isEqualToString:@"location"]) {
    return [ABI30_0_0EXLocationRequester permissions];
  } else if ([type isEqualToString:@"camera"]) {
    return [ABI30_0_0EXCameraPermissionRequester permissions];
  } else if ([type isEqualToString:@"contacts"]) {
    return [ABI30_0_0EXContactsRequester permissions];
  } else if ([type isEqualToString:@"audioRecording"]) {
    return [ABI30_0_0EXAudioRecordingPermissionRequester permissions];
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [ABI30_0_0EXCameraRollRequester permissions];
  } else if ([type isEqualToString:@"calendar"]) {
    return [ABI30_0_0EXCalendarRequester permissions];
  } else if ([type isEqualToString:@"reminders"]) {
    return [ABI30_0_0EXRemindersRequester permissions];
  } else if ([[self class] isPermissionImplicitlyGranted:type]) {
    return [ABI30_0_0EXPermissions alwaysGrantedPermissions]; // permission is implicit
  } else {
    return nil;
  }
}

// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermission:(NSString *)permissionType
{
  NSDictionary *permissions = [self getPermissionsForResource:permissionType];

  if (!permissions) {
    ABI30_0_0EXLogWarn(@"Permission with type '%@' not found.", permissionType);
    return false;
  }
  
  return [permissions[@"status"] isEqualToString:@"granted"] && [_permissionsService hasGrantedPermission:permissionType forExperience:_experienceId];
}

- (void)askForPermission:(NSString *)permissionType
              withResult:(void (^)(BOOL))onResult
            withRejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  return [self askForPermissions:@[permissionType]
                     withResults:^(NSArray<NSNumber *> *results) { onResult([results[0] boolValue]); } // we are sure that result is results.count == 1
                    withRejecter:reject];
}

- (void)askForPermissions:(NSArray<NSString *> *)permissionsTypes
              withResults:(void (^)(NSArray<NSNumber *> *))onResults
             withRejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  return [self askForPermissionsWithTypes:permissionsTypes withResults:^(NSDictionary *results) {
    NSMutableArray<NSNumber *> *finalResults = [NSMutableArray new];
    [results enumerateKeysAndObjectsUsingBlock:^(id _Nonnull key, NSDictionary *singleResult, BOOL * _Nonnull stop) {
      BOOL value = [singleResult[@"status"] isEqualToString:[ABI30_0_0EXPermissions permissionStringForStatus:ABI30_0_0EXPermissionStatusGranted]];
      [finalResults addObject:[NSNumber numberWithBool:value]];
    }];
    onResults(finalResults);
  }
  withRejecter:reject];
}

- (void)askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                       withResults:(void (^)(NSDictionary *results))onResults
                      withRejecter:(ABI30_0_0EXPromiseRejectBlock)reject
{
  NSMutableArray<NSString *> *scopedPermissionsToBeAsked = [NSMutableArray new];
  NSMutableArray<NSString *> *globalPermissionsToBeAsked = [NSMutableArray new];
  NSMutableDictionary *permissions = [NSMutableDictionary new];
  
  if ([permissionsTypes count] != 1 && [permissionsTypes containsObject:@"location"]) {
    return reject (@"E_PERMISSIONS_INVALID", @"iOS platform requires you to ask for Permissions.LOCATION separately.", nil);
  }
  
  for (NSString *permissionType in permissionsTypes) {
    NSMutableDictionary *permission = [[self getPermissionsForResource:permissionType] mutableCopy];
    
    // permission type not found - reject immediately
    if (permission == nil) {
      return reject(@"E_PERMISSIONS_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", permissionType], nil);
    }
    
    if ([permission[@"status"] isEqualToString:[ABI30_0_0EXPermissions permissionStringForStatus:ABI30_0_0EXPermissionStatusGranted]]) {
      // global permission is granted
      
      if ([[self class] isPermissionImplicitlyGranted:permissionType]) {
        // permission is implicitly granted
        permissions[permissionType] = permission;
      } else if (_permissionsService != nil
                 && ![[self class] isExcludedScopedPermission:permissionType]
                 && ![_permissionsService hasGrantedPermission:permissionType forExperience:_experienceId])
      {
        // scoped permission is not granted
        [scopedPermissionsToBeAsked addObject:permissionType];
      } else {
        permissions[permissionType] = permission;
      }
    } else {
      // global permission is not granted
      [globalPermissionsToBeAsked addObject:permissionType];
    }
  }
  
  void (^globalPermissionResolver)(NSDictionary *) = ^(NSDictionary *globalPermissions) {
    [permissions addEntriesFromDictionary:globalPermissions];
    onResults([NSDictionary dictionaryWithDictionary:permissions]);
  };
  
  ABI30_0_0EX_WEAKIFY(self);
  void (^scopedPermissionResolver)(NSDictionary *) = ^(NSDictionary *scopedPermissions) {
    ABI30_0_0EX_ENSURE_STRONGIFY(self);
    [permissions addEntriesFromDictionary:scopedPermissions];
    [self askForGlobalPermissions:globalPermissionsToBeAsked
                     withResolver:globalPermissionResolver
                     withRejecter:reject];
  };
  
  [self askForScopedPermissions:scopedPermissionsToBeAsked withResolver:scopedPermissionResolver withRejecter:reject];
}

+ (id<ABI30_0_0EXPermissionRequester>)getPermissionRequesterForType:(NSString *)type
{
  if ([type isEqualToString:@"notifications"]) {
    return [[ABI30_0_0EXRemoteNotificationRequester alloc] init];
  } else if ([type isEqualToString:@"userFacingNotifications"]) {
    return [[ABI30_0_0EXLocalNotificationRequester alloc] init];
  } else if ([type isEqualToString:@"location"]) {
    return [[ABI30_0_0EXLocationRequester alloc] init];
  } else if ([type isEqualToString:@"camera"]) {
    return [[ABI30_0_0EXCameraPermissionRequester alloc] init];
  } else if ([type isEqualToString:@"contacts"]) {
    return [[ABI30_0_0EXContactsRequester alloc] init];
  } else if ([type isEqualToString:@"audioRecording"]) {
    return [[ABI30_0_0EXAudioRecordingPermissionRequester alloc] init];
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [[ABI30_0_0EXCameraRollRequester alloc] init];
  } else if ([type isEqualToString:@"calendar"]) {
    return [[ABI30_0_0EXCalendarRequester alloc] init];
  } else if ([type isEqualToString:@"reminders"]) {
    return [[ABI30_0_0EXRemindersRequester alloc] init];
  } else {
    return nil;
  }
}

+ (NSString *)permissionStringForStatus:(ABI30_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI30_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI30_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (ABI30_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions
{
  NSString *status = permissions[@"status"];
  if ([status isEqualToString:@"granted"]) {
    return ABI30_0_0EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return ABI30_0_0EXPermissionStatusDenied;
  } else {
    return ABI30_0_0EXPermissionStatusUndetermined;
  }
}

+ (NSString *)textForPermissionType:(NSString *)type
{
  if ([type isEqualToString:@"location"]) {
    return type;
  } else if ([type isEqualToString:@"camera"]) {
    return type;
  } else if ([type isEqualToString:@"contacts"]) {
    return type;
  } else if ([type isEqualToString:@"audioRecording"]) {
    return @"recording audio";
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return @"photos";
  } else if ([type isEqualToString:@"calendar"]) {
    return type;
  } else if ([type isEqualToString:@"reminders"]) {
    return type;
  } else if ([type isEqualToString:@"SMS"]) {
    return type;
  }
  return nil;
}

+ (BOOL)isPermissionImplicitlyGranted:(NSString *)permissionType
{
  return [@[@"systemBrightness", @"SMS"] containsObject:permissionType];
}

+ (BOOL)isExcludedScopedPermission:(NSString *)permissionType
{
  // temporarily exclude notifactions from permissions per experience; system brightness is always granted
  return [@[@"notifications", @"userFacingNotifications", @"systemBrightness"] containsObject:permissionType];
}

- (void)permissionRequesterDidFinish:(NSObject<ABI30_0_0EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
