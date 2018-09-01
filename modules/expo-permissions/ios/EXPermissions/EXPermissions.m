// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCore/EXUtilitiesInterface.h>
#import <EXCore/EXUtilities.h>
#import <EXPermissions/EXAudioRecordingPermissionRequester.h>
#import <EXPermissions/EXCalendarRequester.h>
#import <EXPermissions/EXCameraPermissionRequester.h>
#import <EXPermissions/EXContactsRequester.h>
#import <EXPermissions/EXLocationRequester.h>
#import <EXPermissions/EXPermissions.h>
#import <EXPermissions/EXLocalNotificationRequester.h>
#import <EXPermissions/EXRemindersRequester.h>
#import <EXPermissions/EXRemoteNotificationRequester.h>
#import <EXPermissions/EXCameraRollRequester.h>

NSString * const EXPermissionExpiresNever = @"never";

@interface EXPermissions ()

@property (nonatomic, strong) NSMutableArray *requests;
@property (nonatomic, weak) id<EXPermissionsServiceInterface> permissionsService;
@property (nonatomic, weak) id<EXUtilitiesInterface> utils;
@property (nonatomic, assign) NSString *experienceId;

@end

@implementation EXPermissions

EX_EXPORT_MODULE(ExponentPermissions);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXPermissionsInterface)];
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

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _permissionsService = [moduleRegistry getSingletonModuleForName:@"Permissions"];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
}

# pragma mark - Expo exported methods

EX_EXPORT_METHOD_AS(getAsync,
                    getPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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
          && [permission[@"status"] isEqualToString:[[self class] permissionStringForStatus:EXPermissionStatusGranted]]
          && ![_permissionsService hasGrantedPermission:permissionType forExperience:_experienceId])
      {
        permission[@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
      }
    }
    permissions[permissionType] = permission;
  }
  resolve([NSDictionary dictionaryWithDictionary:permissions]);
}

EX_EXPORT_METHOD_AS(askAsync,
                    askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [self askForPermissionsWithTypes:permissionsTypes
                       withResults:resolve
                      withRejecter:reject];
}

# pragma mark - permission requsters / getters

- (void)askForGlobalPermissions:(NSArray<NSString *> *)permissionsTypes
                   withResolver:(void (^)(NSDictionary *))resolver
                   withRejecter:(EXPromiseRejectBlock)reject
{
  // nothing to ask for - return immediately
  if (permissionsTypes.count == 0) {
    return resolver(@{});
  }

  __block NSMutableDictionary *permissions = [NSMutableDictionary new];
  __block NSMutableSet *permissionsToBeAsked = [NSMutableSet setWithArray:permissionsTypes];
  __block NSString *permissionType; // accumulator for currently proceessed permissionType
  EX_WEAKIFY(self);
  
  __block void (^customResolver)(NSDictionary *); // forward declaration
  __block void (^askForNextPermission)(void) = ^() {
    // stop condition: no permission left to be asked - resolve with results
    if (permissionsToBeAsked.count == 0) {
      return resolver(permissions);
    }
  
    EX_ENSURE_STRONGIFY(self);
  
    // pop next permissionType from set
    permissionType = [permissionsToBeAsked anyObject];
    [permissionsToBeAsked removeObject:permissionType];
    
    id<EXPermissionRequester> requester = [[self class] getPermissionRequesterForType:permissionType];
    
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
    EX_ENSURE_STRONGIFY(self);
    
    // save results for permission
    permissions[permissionType] = [NSMutableDictionary dictionaryWithDictionary:permission];
    
    // check if save scoped permissions & singal possible failure by marking permission as denied
    if (self.permissionsService != nil
        && ![[self class] isExcludedScopedPermission:permissionType]
        && ![self.permissionsService savePermission:permission
                                             ofType:permissionType
                                      forExperience:self.experienceId])
    {
      permissions[permissionType][@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
    }
    
    askForNextPermission();
  };
  
  // ask for first permission
  askForNextPermission();
}

- (void)askForScopedPermissions:(NSArray<NSString *> *)permissionsTypes
                   withResolver:(void (^)(NSDictionary *))resolver
                   withRejecter:(EXPromiseRejectBlock)reject
{
  // nothing to ask for - return immediately
  if (permissionsTypes.count == 0) {
    return resolver(@{});
  }

  __block NSMutableDictionary *permissions = [NSMutableDictionary new];
  __block NSMutableSet *permissionsToBeAsked = [NSMutableSet setWithArray:permissionsTypes];
  __block NSString *permissionType; // accumulator for currently proceessed permissionType
  EX_WEAKIFY(self);
  
  __block void (^askForNextPermission)(void) = ^() {
    // stop condition: no permission left to be asked - resolve with results
    if (permissionsToBeAsked.count == 0) {
      resolver(permissions);
      askForNextPermission = nil;
      return;
    }
    
    EX_ENSURE_STRONGIFY(self);

    // pop next permissionType from set
    permissionType = [permissionsToBeAsked anyObject];
    [permissionsToBeAsked removeObject:permissionType];

    // initilize as global permission
    permissions[permissionType] = [NSMutableDictionary dictionaryWithDictionary:[self getPermissionsForResource:permissionType]];

    // had to reinitilize UIAlertActions between alertShow invocations
    UIAlertAction *allowAction = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      EX_ENSURE_STRONGIFY(self);
      // try to save scoped permissions - if fails than permission is denied
      if (![self.permissionsService savePermission:permissions[permissionType] ofType:permissionType forExperience:self.experienceId]) {
        permissions[permissionType][@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
      }
      askForNextPermission();
    }];

    UIAlertAction *denyAction = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
      EX_ENSURE_STRONGIFY(self);
      permissions[permissionType][@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
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

  EX_WEAKIFY(self);
  [EXUtilities performSynchronouslyOnMainThread:^{
    EX_ENSURE_STRONGIFY(self);
    // TODO: below line is sometimes failing with: "Presenting view controllers on detached view controllers is discourage"
    [self->_utils.currentViewController presentViewController:alert animated:YES completion:nil];
  }];
}

+ (NSDictionary *)alwaysGrantedPermissions {
  return @{
           @"status": [EXPermissions permissionStringForStatus:EXPermissionStatusGranted],
           @"expires": EXPermissionExpiresNever,
           };
}

- (NSDictionary *)getPermissionsForResource:(NSString *)type
{
  if ([type isEqualToString:@"notifications"]) {
    return [EXRemoteNotificationRequester permissions];
  } else if ([type isEqualToString:@"userFacingNotifications"]) {
    return [EXLocalNotificationRequester permissions];
  } else if ([type isEqualToString:@"location"]) {
    return [EXLocationRequester permissions];
  } else if ([type isEqualToString:@"camera"]) {
    return [EXCameraPermissionRequester permissions];
  } else if ([type isEqualToString:@"contacts"]) {
    return [EXContactsRequester permissions];
  } else if ([type isEqualToString:@"audioRecording"]) {
    return [EXAudioRecordingPermissionRequester permissions];
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [EXCameraRollRequester permissions];
  } else if ([type isEqualToString:@"calendar"]) {
    return [EXCalendarRequester permissions];
  } else if ([type isEqualToString:@"reminders"]) {
    return [EXRemindersRequester permissions];
  } else if ([[self class] isPermissionImplicitlyGranted:type]) {
    return [EXPermissions alwaysGrantedPermissions]; // permission is implicit
  } else {
    return nil;
  }
}

// shorthand method that checks both global and per-experience permission
- (BOOL)hasGrantedPermission:(NSString *)permissionType
{
  NSDictionary *permissions = [self getPermissionsForResource:permissionType];

  if (!permissions) {
    EXLogWarn(@"Permission with type '%@' not found.", permissionType);
    return false;
  }
  
  return [permissions[@"status"] isEqualToString:@"granted"] && [_permissionsService hasGrantedPermission:permissionType forExperience:_experienceId];
}

- (void)askForPermission:(NSString *)permissionType
              withResult:(void (^)(BOOL))onResult
            withRejecter:(EXPromiseRejectBlock)reject
{
  return [self askForPermissions:@[permissionType]
                     withResults:^(NSArray<NSNumber *> *results) { onResult([results[0] boolValue]); } // we are sure that result is results.count == 1
                    withRejecter:reject];
}

- (void)askForPermissions:(NSArray<NSString *> *)permissionsTypes
              withResults:(void (^)(NSArray<NSNumber *> *))onResults
             withRejecter:(EXPromiseRejectBlock)reject
{
  return [self askForPermissionsWithTypes:permissionsTypes withResults:^(NSDictionary *results) {
    NSMutableArray<NSNumber *> *finalResults = [NSMutableArray new];
    [results enumerateKeysAndObjectsUsingBlock:^(id _Nonnull key, NSDictionary *singleResult, BOOL * _Nonnull stop) {
      BOOL value = [singleResult[@"status"] isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusGranted]];
      [finalResults addObject:[NSNumber numberWithBool:value]];
    }];
    onResults(finalResults);
  }
  withRejecter:reject];
}

- (void)askForPermissionsWithTypes:(NSArray<NSString *> *)permissionsTypes
                       withResults:(void (^)(NSDictionary *results))onResults
                      withRejecter:(EXPromiseRejectBlock)reject
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
    
    if ([permission[@"status"] isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusGranted]]) {
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
  
  EX_WEAKIFY(self);
  void (^scopedPermissionResolver)(NSDictionary *) = ^(NSDictionary *scopedPermissions) {
    EX_ENSURE_STRONGIFY(self);
    [permissions addEntriesFromDictionary:scopedPermissions];
    [self askForGlobalPermissions:globalPermissionsToBeAsked
                     withResolver:globalPermissionResolver
                     withRejecter:reject];
  };
  
  [self askForScopedPermissions:scopedPermissionsToBeAsked withResolver:scopedPermissionResolver withRejecter:reject];
}

+ (id<EXPermissionRequester>)getPermissionRequesterForType:(NSString *)type
{
  if ([type isEqualToString:@"notifications"]) {
    return [[EXRemoteNotificationRequester alloc] init];
  } else if ([type isEqualToString:@"userFacingNotifications"]) {
    return [[EXLocalNotificationRequester alloc] init];
  } else if ([type isEqualToString:@"location"]) {
    return [[EXLocationRequester alloc] init];
  } else if ([type isEqualToString:@"camera"]) {
    return [[EXCameraPermissionRequester alloc] init];
  } else if ([type isEqualToString:@"contacts"]) {
    return [[EXContactsRequester alloc] init];
  } else if ([type isEqualToString:@"audioRecording"]) {
    return [[EXAudioRecordingPermissionRequester alloc] init];
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [[EXCameraRollRequester alloc] init];
  } else if ([type isEqualToString:@"calendar"]) {
    return [[EXCalendarRequester alloc] init];
  } else if ([type isEqualToString:@"reminders"]) {
    return [[EXRemindersRequester alloc] init];
  } else {
    return nil;
  }
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

- (void)permissionRequesterDidFinish:(NSObject<EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
