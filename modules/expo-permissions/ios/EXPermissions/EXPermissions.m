// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXCore/EXUtilitiesInterface.h>
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

EX_EXPORT_METHOD_AS(getAsync,
                    getCurrentPermissionsWithType:(NSString *)type
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  NSDictionary *globalPermissions = [self getPermissionsForResource:type];

  if (globalPermissions == nil) {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
    return;
  }

  if (_permissionsService != nil) {
    NSMutableDictionary *response = [[NSMutableDictionary alloc] initWithDictionary:globalPermissions];

    if (![[self class] isExcludedScopedPermission:type] &&
        [globalPermissions[@"status"] isEqualToString:[[self class] permissionStringForStatus:EXPermissionStatusGranted]] &&
        ![_permissionsService hasGrantedPermission:type forExperience:_experienceId]) {
      response[@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
    }
    resolve(response);
  } else {
    resolve(globalPermissions);
  }
}

EX_EXPORT_METHOD_AS(askAsync,
                    askForPermissionsWithType:(NSString *)type
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  NSDictionary *globalPermissions = [self getPermissionsForResource:type];

  if (globalPermissions == nil) {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
    return;
  }

  if ([globalPermissions[@"status"] isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusGranted]]) {
    // global permission for the app is granted

    if (_permissionsService != nil && ![[self class] isExcludedScopedPermission:type] && ![_permissionsService hasGrantedPermission:type forExperience:_experienceId]) {
      // per-experience permission is not granted
      [self askForExperiencePermission:type withGlobalPermissions:globalPermissions resolve:resolve reject:reject];
    } else {
      // if we already have both global and scoped permissions granted, resolve immediately with that
      resolve(globalPermissions);
    }
  } else {
    id<EXPermissionRequester> requester = [[self class] getPermissionRequesterForType:type];

    if (requester == nil) {
      // TODO: other types of permission requesters, e.g. facebook
      reject(@"E_PERMISSION_UNSUPPORTED", [NSString stringWithFormat:@"Cannot request permission: %@", type], nil);
      return;
    }

    // we need custom resolver for the requester cause we need to save given permissions per experience
    __weak typeof(self) weakSelf = self;
    void (^customResolver)(NSDictionary *result) = ^(NSDictionary *result) {
      __strong typeof(weakSelf) strongSelf = weakSelf;
      if (strongSelf) {
        if (strongSelf->_permissionsService != nil) {
          [strongSelf->_permissionsService savePermission:result ofType:type forExperience:strongSelf->_experienceId];
        }
        resolve(result);
      }
    };

    [_requests addObject:requester];
    [requester setDelegate:self];
    [requester requestPermissionsWithResolver:customResolver rejecter:reject];
  }
}

- (void)askForExperiencePermission:(NSString *)type withGlobalPermissions:(NSDictionary *)globalPermissions resolve:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject
{
  __weak typeof(self) weakSelf = self;

  UIAlertAction *allow = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction * action) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      if ([strongSelf->_permissionsService savePermission:globalPermissions ofType:type forExperience:strongSelf.experienceId]) {
        resolve(globalPermissions);
      } else {
        NSMutableDictionary *deniedResult = [[NSMutableDictionary alloc] initWithDictionary:globalPermissions];
        deniedResult[@"status"] = [[weakSelf class] permissionStringForStatus:EXPermissionStatusDenied];
        resolve(deniedResult);
      }
    }
  }];

  UIAlertAction *deny = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction * action) {
    NSMutableDictionary *deniedResult = [[NSMutableDictionary alloc] initWithDictionary:globalPermissions];
    deniedResult[@"status"] = [[weakSelf class] permissionStringForStatus:EXPermissionStatusDenied];
    resolve(deniedResult);
  }];
  [self showPermissionRequestAlert:type withAllowAction:allow withDenyAction:deny];
}

- (void)showPermissionRequestAlert:(NSString *)type withAllowAction:(UIAlertAction *)allow withDenyAction:(UIAlertAction *)deny
{
  NSString *permissionString = [[self class] textForPermissionType:type];
  NSString *experienceName = self.experienceId; // TODO: we might want to use name from the manifest?

  NSString *message = [NSString stringWithFormat:@"%1$@ needs permissions for %2$@. You\'ve already granted permission to another Expo experience. Allow %1$@ to use it also?", experienceName, permissionString];
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Experience needs permissions"
                                                                 message:message
                                                          preferredStyle:UIAlertControllerStyleAlert];

  [alert addAction:deny];
  [alert addAction:allow];

  [_utils.currentViewController presentViewController:alert animated:YES completion:nil];
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
