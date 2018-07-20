// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXCore/ABI29_0_0EXUtilitiesInterface.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXAudioRecordingPermissionRequester.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXCalendarRequester.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXCameraPermissionRequester.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXContactsRequester.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXLocationRequester.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXPermissions.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXLocalNotificationRequester.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXRemindersRequester.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXRemoteNotificationRequester.h>
#import <ABI29_0_0EXPermissions/ABI29_0_0EXCameraRollRequester.h>

NSString * const ABI29_0_0EXPermissionExpiresNever = @"never";

@interface ABI29_0_0EXPermissions ()

@property (nonatomic, strong) NSMutableArray *requests;
@property (nonatomic, weak) id<ABI29_0_0EXPermissionsServiceInterface> permissionsService;
@property (nonatomic, weak) id<ABI29_0_0EXUtilitiesInterface> utils;
@property (nonatomic, assign) NSString *experienceId;

@end

@implementation ABI29_0_0EXPermissions

ABI29_0_0EX_EXPORT_MODULE(ExponentPermissions);

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI29_0_0EXPermissionsInterface)];
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

- (void)setModuleRegistry:(ABI29_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsService = [moduleRegistry getSingletonModuleForName:@"Permissions"];
  _utils = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI29_0_0EXUtilitiesInterface)];
}

ABI29_0_0EX_EXPORT_METHOD_AS(getAsync,
                    getCurrentPermissionsWithType:(NSString *)type
                    resolver:(ABI29_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI29_0_0EXPromiseRejectBlock)reject)
{
  NSDictionary *globalPermissions = [self getPermissionsForResource:type];

  if (globalPermissions == nil) {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
    return;
  }

  if (_permissionsService != nil) {
    NSMutableDictionary *response = [[NSMutableDictionary alloc] initWithDictionary:globalPermissions];

    if (![[self class] isExcludedScopedPermission:type] &&
        [globalPermissions[@"status"] isEqualToString:[[self class] permissionStringForStatus:ABI29_0_0EXPermissionStatusGranted]] &&
        ![_permissionsService hasGrantedPermission:type forExperience:_experienceId]) {
      response[@"status"] = [[self class] permissionStringForStatus:ABI29_0_0EXPermissionStatusDenied];
    }
    resolve(response);
  } else {
    resolve(globalPermissions);
  }
}

ABI29_0_0EX_EXPORT_METHOD_AS(askAsync,
                    askForPermissionsWithType:(NSString *)type
                    resolver:(ABI29_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI29_0_0EXPromiseRejectBlock)reject)
{
  NSDictionary *globalPermissions = [self getPermissionsForResource:type];

  if (globalPermissions == nil) {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
    return;
  }

  if ([globalPermissions[@"status"] isEqualToString:[ABI29_0_0EXPermissions permissionStringForStatus:ABI29_0_0EXPermissionStatusGranted]]) {
    // global permission for the app is granted

    if (_permissionsService != nil && ![[self class] isExcludedScopedPermission:type] && ![_permissionsService hasGrantedPermission:type forExperience:_experienceId]) {
      // per-experience permission is not granted
      [self askForExperiencePermission:type withGlobalPermissions:globalPermissions resolve:resolve reject:reject];
    } else {
      // if we already have both global and scoped permissions granted, resolve immediately with that
      resolve(globalPermissions);
    }
  } else {
    id<ABI29_0_0EXPermissionRequester> requester = [[self class] getPermissionRequesterForType:type];

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

- (void)askForExperiencePermission:(NSString *)type withGlobalPermissions:(NSDictionary *)globalPermissions resolve:(ABI29_0_0EXPromiseResolveBlock)resolve reject:(ABI29_0_0EXPromiseRejectBlock)reject
{
  __weak typeof(self) weakSelf = self;

  UIAlertAction *allow = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction * action) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      if ([strongSelf->_permissionsService savePermission:globalPermissions ofType:type forExperience:strongSelf.experienceId]) {
        resolve(globalPermissions);
      } else {
        NSMutableDictionary *deniedResult = [[NSMutableDictionary alloc] initWithDictionary:globalPermissions];
        deniedResult[@"status"] = [[weakSelf class] permissionStringForStatus:ABI29_0_0EXPermissionStatusDenied];
        resolve(deniedResult);
      }
    }
  }];

  UIAlertAction *deny = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction * action) {
    NSMutableDictionary *deniedResult = [[NSMutableDictionary alloc] initWithDictionary:globalPermissions];
    deniedResult[@"status"] = [[weakSelf class] permissionStringForStatus:ABI29_0_0EXPermissionStatusDenied];
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
           @"status": [ABI29_0_0EXPermissions permissionStringForStatus:ABI29_0_0EXPermissionStatusGranted],
           @"expires": ABI29_0_0EXPermissionExpiresNever,
           };
}

- (NSDictionary *)getPermissionsForResource:(NSString *)type
{
  if ([type isEqualToString:@"notifications"]) {
    return [ABI29_0_0EXRemoteNotificationRequester permissions];
  } else if ([type isEqualToString:@"userFacingNotifications"]) {
    return [ABI29_0_0EXLocalNotificationRequester permissions];
  } else if ([type isEqualToString:@"location"]) {
    return [ABI29_0_0EXLocationRequester permissions];
  } else if ([type isEqualToString:@"camera"]) {
    return [ABI29_0_0EXCameraPermissionRequester permissions];
  } else if ([type isEqualToString:@"contacts"]) {
    return [ABI29_0_0EXContactsRequester permissions];
  } else if ([type isEqualToString:@"audioRecording"]) {
    return [ABI29_0_0EXAudioRecordingPermissionRequester permissions];
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [ABI29_0_0EXCameraRollRequester permissions];
  } else if ([type isEqualToString:@"calendar"]) {
    return [ABI29_0_0EXCalendarRequester permissions];
  } else if ([type isEqualToString:@"reminders"]) {
    return [ABI29_0_0EXRemindersRequester permissions];
  } else if ([[self class] isPermissionImplicitlyGranted:type]) {
    return [ABI29_0_0EXPermissions alwaysGrantedPermissions]; // permission is implicit
  } else {
    return nil;
  }
}

+ (id<ABI29_0_0EXPermissionRequester>)getPermissionRequesterForType:(NSString *)type
{
  if ([type isEqualToString:@"notifications"]) {
    return [[ABI29_0_0EXRemoteNotificationRequester alloc] init];
  } else if ([type isEqualToString:@"userFacingNotifications"]) {
    return [[ABI29_0_0EXLocalNotificationRequester alloc] init];
  } else if ([type isEqualToString:@"location"]) {
    return [[ABI29_0_0EXLocationRequester alloc] init];
  } else if ([type isEqualToString:@"camera"]) {
    return [[ABI29_0_0EXCameraPermissionRequester alloc] init];
  } else if ([type isEqualToString:@"contacts"]) {
    return [[ABI29_0_0EXContactsRequester alloc] init];
  } else if ([type isEqualToString:@"audioRecording"]) {
    return [[ABI29_0_0EXAudioRecordingPermissionRequester alloc] init];
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [[ABI29_0_0EXCameraRollRequester alloc] init];
  } else if ([type isEqualToString:@"calendar"]) {
    return [[ABI29_0_0EXCalendarRequester alloc] init];
  } else if ([type isEqualToString:@"reminders"]) {
    return [[ABI29_0_0EXRemindersRequester alloc] init];
  } else {
    return nil;
  }
}

+ (NSString *)permissionStringForStatus:(ABI29_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI29_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI29_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (ABI29_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions
{
  NSString *status = permissions[@"status"];
  if ([status isEqualToString:@"granted"]) {
    return ABI29_0_0EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return ABI29_0_0EXPermissionStatusDenied;
  } else {
    return ABI29_0_0EXPermissionStatusUndetermined;
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

- (void)permissionRequesterDidFinish:(NSObject<ABI29_0_0EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
