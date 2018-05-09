// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXAudioRecordingPermissionRequester.h"
#import "EXCalendarRequester.h"
#import "EXCameraPermissionRequester.h"
#import "EXContactsRequester.h"
#import "EXLocationRequester.h"
#import "EXPermissions.h"
#import "EXLocalNotificationRequester.h"
#import "EXRemindersRequester.h"
#import "EXRemoteNotificationRequester.h"
#import "EXCameraRollRequester.h"
#import "EXScopedModuleRegistry.h"
#import <React/RCTUtils.h>

NSString * const EXPermissionExpiresNever = @"never";

@interface EXPermissions ()

@property (nonatomic, strong) NSDictionary *manifest;
@property (nonatomic, weak) id kernelPermissionsServiceDelegate;
@property (nonatomic, strong) NSMutableArray *requests;

@end

@implementation EXPermissions

EX_EXPORT_SCOPED_MODULE(ExponentPermissions, PermissionsManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelPermissionsServiceDelegate = kernelServiceInstance;
    _manifest = params[@"manifest"];
    _requests = [NSMutableArray array];
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

+ (NSArray<NSString *> *)excludedScopedPermissions
{
  // temporarily exclude notifactions from permissions per experience; system brightness is always granted
  return @[@"notifications", @"userFacingNotifications", @"systemBrightness"];
}

RCT_REMAP_METHOD(getAsync,
                 getCurrentPermissionsWithType:(NSString *)type
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *globalPermissionsResult = [self getSystemPermissionsWithType:type];
  if (globalPermissionsResult == nil) {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
    return;
  }
  
  NSMutableDictionary *response = [[NSMutableDictionary alloc] initWithDictionary:globalPermissionsResult];
    if (![[[self class] excludedScopedPermissions] containsObject:type] &&
      [globalPermissionsResult[@"status"] isEqualToString:[[self class] permissionStringForStatus:EXPermissionStatusGranted]]) {
    if (![_kernelPermissionsServiceDelegate hasGrantedPermission:type forExperience:self.experienceId]) {
      response[@"status"] = [[self class] permissionStringForStatus:EXPermissionStatusDenied];
    }
  }
  resolve(response);
}

RCT_REMAP_METHOD(askAsync,
                 askForPermissionsWithType:(NSString *)type
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *systemPermissions = [self getSystemPermissionsWithType:type];
  if (systemPermissions == nil) {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
    return;
  }
  if ([systemPermissions[@"status"] isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusGranted]]) {
    if (![[[self class] excludedScopedPermissions] containsObject:type] &&
        ![_kernelPermissionsServiceDelegate hasGrantedPermission:type forExperience:self.experienceId]) {
      __weak typeof(self) weakSelf = self;
      UIAlertAction *allow = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction * action) {
        if ([_kernelPermissionsServiceDelegate savePermission:systemPermissions ofType:type forExperience:self.experienceId]) {
          resolve(systemPermissions);
        } else {
          NSMutableDictionary *deniedResult = [[NSMutableDictionary alloc] initWithDictionary:systemPermissions];
          deniedResult[@"status"] = [[weakSelf class] permissionStringForStatus:EXPermissionStatusDenied];
          resolve(deniedResult);
        }
      }];
      
      UIAlertAction *deny = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction * action) {
        NSMutableDictionary *deniedResult = [[NSMutableDictionary alloc] initWithDictionary:systemPermissions];
        deniedResult[@"status"] = [[weakSelf class] permissionStringForStatus:EXPermissionStatusDenied];
        resolve(deniedResult);
      }];
      [self showPermissionRequestAlert:type withAllowAction:allow withDenyAction:deny];
    } else {
      // if we already have both global and scoped permissions granted, resolve immediately with that
      resolve(systemPermissions);
    }
  } else {
    id<EXPermissionRequester> requester;
    if ([type isEqualToString:@"notifications"]) {
      requester = [[EXRemoteNotificationRequester alloc] init];
    } else if ([type isEqualToString:@"userFacingNotifications"]) {
      requester = [[EXLocalNotificationRequester alloc] init];
    } else if ([type isEqualToString:@"notifications"]) {
      requester = [[EXRemoteNotificationRequester alloc] init];
    } else if ([type isEqualToString:@"userFacingNotifications"]) {
      requester = [[EXLocalNotificationRequester alloc] init];
    } else if ([type isEqualToString:@"location"]) {
      requester = [[EXLocationRequester alloc] init];
    } else if ([type isEqualToString:@"camera"]) {
      requester = [[EXCameraPermissionRequester alloc] init];
    } else if ([type isEqualToString:@"contacts"]) {
      requester = [[EXContactsRequester alloc] init];
    } else if ([type isEqualToString:@"audioRecording"]) {
      requester = [[EXAudioRecordingPermissionRequester alloc] init];
    } else if ([type isEqualToString:@"cameraRoll"]) {
      requester = [[EXCameraRollRequester alloc] init];
    } else if ([type isEqualToString:@"calendar"]) {
      requester = [[EXCalendarRequester alloc] init];
    } else if ([type isEqualToString:@"reminders"]) {
      requester = [[EXRemindersRequester alloc] init];
    } else {
      // TODO: other types of permission requesters, e.g. facebook
      reject(@"E_PERMISSION_UNSUPPORTED", [NSString stringWithFormat:@"Cannot request permission: %@", type], nil);
    }
    if (requester) {
      [_requests addObject:requester];
      [requester setDelegate:self];
      [requester requestPermissionsWithResolver:resolve rejecter:reject];
    }
  }
}

- (NSDictionary *)getSystemPermissionsWithType:(NSString *)type
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
  } else if ([type isEqualToString:@"systemBrightness"]) {
    return [EXPermissions alwaysGrantedPermissions]; // permission is implicit
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [EXCameraRollRequester permissions];
  } else if ([type isEqualToString:@"calendar"]) {
    return [EXCalendarRequester permissions];
  } else if ([type isEqualToString:@"reminders"]) {
    return [EXRemindersRequester permissions];
  }
  return nil;
}

- (void)showPermissionRequestAlert:(NSString *)type withAllowAction:(UIAlertAction *)allow withDenyAction:(UIAlertAction *)deny
{
  NSString *permissionString = [[self class] textForPermissionType:type];
  NSString *experienceName;
  if (!_manifest || [_manifest objectForKey:@"name"] == nil) {
    experienceName = self.experienceId;
  } else {
    experienceName = _manifest[@"name"];
  }
  NSString *message = [NSString stringWithFormat:@"%1$@ needs permissions for %2$@. You\'ve already granted permission to another Expo experience. Allow %1$@ to use it also?", experienceName, permissionString];
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"Experience needs permissions"
                                                                 message:message
                                                          preferredStyle:UIAlertControllerStyleAlert];
  
  [alert addAction:deny];
  [alert addAction:allow];
  
  [RCTPresentedViewController() presentViewController:alert animated:YES completion:nil];
}

+ (NSDictionary *)alwaysGrantedPermissions {
  return @{
    @"status": [EXPermissions permissionStringForStatus:EXPermissionStatusGranted],
    @"expires": EXPermissionExpiresNever,
  };
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
  }
  return nil;
}

+ (NSString *)typeForRequester:(NSObject<EXPermissionRequester> *)requester
{
  if ([requester isKindOfClass:[EXLocationRequester class]]) {
    return @"location";
  } else if ([requester isKindOfClass:[EXCameraPermissionRequester class]]) {
    return @"camera";
  } else if ([requester isKindOfClass:[EXContactsRequester class]]) {
    return @"contacts";
  } else if ([requester isKindOfClass:[EXAudioRecordingPermissionRequester class]]) {
    return @"audioRecording";
  } else if ([requester isKindOfClass:[EXCameraRollRequester class]]) {
    return @"cameraRoll";
  } else if ([requester isKindOfClass:[EXCalendarRequester class]]) {
    return @"calendar";
  } else if ([requester isKindOfClass:[EXRemindersRequester class]]) {
    return @"reminders";
  }
  return @"unknown";
}

- (void)permissionsRequester:(NSObject<EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult
{
  if ([_requests containsObject:requester]) {
    if (requestResult) {
      [_kernelPermissionsServiceDelegate savePermission:requestResult ofType:[[self class] typeForRequester:requester] forExperience:self.experienceId];
    }
    [_requests removeObject:requester];
  }
}

@end
