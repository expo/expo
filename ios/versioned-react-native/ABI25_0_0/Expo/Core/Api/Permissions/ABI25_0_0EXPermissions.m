// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXAudioRecordingPermissionRequester.h"
#import "ABI25_0_0EXCalendarRequester.h"
#import "ABI25_0_0EXCameraPermissionRequester.h"
#import "ABI25_0_0EXContactsRequester.h"
#import "ABI25_0_0EXLocationRequester.h"
#import "ABI25_0_0EXPermissions.h"
#import "ABI25_0_0EXRemindersRequester.h"
#import "ABI25_0_0EXRemoteNotificationRequester.h"
#import "ABI25_0_0EXCameraRollRequester.h"
#import "ABI25_0_0EXScopedModuleRegistry.h"
#import <ABI25_0_0React/ABI25_0_0RCTUtils.h>

NSString * const ABI25_0_0EXPermissionExpiresNever = @"never";

@interface ABI25_0_0EXPermissions ()

@property (nonatomic, strong) NSDictionary *manifest;
@property (nonatomic, weak) id kernelPermissionsServiceDelegate;
@property (nonatomic, strong) NSMutableArray *requests;

@end

@implementation ABI25_0_0EXPermissions

ABI25_0_0EX_EXPORT_SCOPED_MODULE(ExponentPermissions, PermissionsManager);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelPermissionsServiceDelegate = kernelServiceInstance;
    _manifest = params[@"manifest"];
    _requests = [NSMutableArray array];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI25_0_0RCT_REMAP_METHOD(getAsync,
                 getCurrentPermissionsWithType:(NSString *)type
                 resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
  NSDictionary *globalPermissionsResult = [self getSystemPermissionsWithType:type];
  if (globalPermissionsResult == nil) {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
    return;
  }
  
  NSMutableDictionary *response = [[NSMutableDictionary alloc] initWithDictionary:globalPermissionsResult];
  // temporarily exclude notifactions from permissions per experience
  if (![type isEqualToString:@"notifications"] && ![type isEqualToString:@"userFacingNotifications"] &&
      [globalPermissionsResult[@"status"] isEqualToString:[[self class] permissionStringForStatus:ABI25_0_0EXPermissionStatusGranted]]) {
    if (![_kernelPermissionsServiceDelegate hasGrantedPermission:type forExperience:self.experienceId]) {
      response[@"status"] = [[self class] permissionStringForStatus:ABI25_0_0EXPermissionStatusDenied];
    }
  }
  resolve(response);
}

ABI25_0_0RCT_REMAP_METHOD(askAsync,
                 askForPermissionsWithType:(NSString *)type
                 resolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI25_0_0RCTPromiseRejectBlock)reject)
{
  NSDictionary *systemPermissions = [self getSystemPermissionsWithType:type];
  if (systemPermissions == nil) {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
    return;
  }
  if ([systemPermissions[@"status"] isEqualToString:[ABI25_0_0EXPermissions permissionStringForStatus:ABI25_0_0EXPermissionStatusGranted]]) {
    // temporarily exclude notifactions from permissions per experience
    if (![type isEqualToString:@"notifications"] && ![type isEqualToString:@"userFacingNotifications"] &&
        ![_kernelPermissionsServiceDelegate hasGrantedPermission:type forExperience:self.experienceId]) {
      __weak typeof(self) weakSelf = self;
      UIAlertAction *allow = [UIAlertAction actionWithTitle:@"Allow" style:UIAlertActionStyleDefault handler:^(UIAlertAction * action) {
        if ([_kernelPermissionsServiceDelegate savePermission:systemPermissions ofType:type forExperience:self.experienceId]) {
          resolve(systemPermissions);
        } else {
          NSMutableDictionary *deniedResult = [[NSMutableDictionary alloc] initWithDictionary:systemPermissions];
          deniedResult[@"status"] = [[weakSelf class] permissionStringForStatus:ABI25_0_0EXPermissionStatusDenied];
          resolve(deniedResult);
        }
      }];
      
      UIAlertAction *deny = [UIAlertAction actionWithTitle:@"Deny" style:UIAlertActionStyleDefault handler:^(UIAlertAction * action) {
        NSMutableDictionary *deniedResult = [[NSMutableDictionary alloc] initWithDictionary:systemPermissions];
        deniedResult[@"status"] = [[weakSelf class] permissionStringForStatus:ABI25_0_0EXPermissionStatusDenied];
        resolve(deniedResult);
      }];
      [self showPermissionRequestAlert:type withAllowAction:allow withDenyAction:deny];
    } else {
      // if we already have both global and scoped permissions granted, resolve immediately with that
      resolve(systemPermissions);
    }
  } else {
    NSObject<ABI25_0_0EXPermissionRequester> *requester;
    if ([type isEqualToString:@"remoteNotifications"]) {
      requester = [[ABI25_0_0EXRemoteNotificationRequester alloc] init];
    } else if ([type isEqualToString:@"location"]) {
      requester = [[ABI25_0_0EXLocationRequester alloc] init];
    } else if ([type isEqualToString:@"camera"]) {
      requester = [[ABI25_0_0EXCameraPermissionRequester alloc] init];
    } else if ([type isEqualToString:@"contacts"]) {
      requester = [[ABI25_0_0EXContactsRequester alloc] init];
    } else if ([type isEqualToString:@"audioRecording"]) {
      requester = [[ABI25_0_0EXAudioRecordingPermissionRequester alloc] init];
    } else if ([type isEqualToString:@"cameraRoll"]) {
      requester = [[ABI25_0_0EXCameraRollRequester alloc] init];
    } else if ([type isEqualToString:@"calendar"]) {
      requester = [[ABI25_0_0EXCalendarRequester alloc] init];
    } else if ([type isEqualToString:@"reminders"]) {
      requester = [[ABI25_0_0EXRemindersRequester alloc] init];
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
  if ([type isEqualToString:@"remoteNotifications"]) {
    return [ABI25_0_0EXRemoteNotificationRequester permissions];
  } else if ([type isEqualToString:@"location"]) {
    return [ABI25_0_0EXLocationRequester permissions];
  } else if ([type isEqualToString:@"camera"]) {
    return [ABI25_0_0EXCameraPermissionRequester permissions];
  } else if ([type isEqualToString:@"contacts"]) {
    return [ABI25_0_0EXContactsRequester permissions];
  } else if ([type isEqualToString:@"audioRecording"]) {
    return [ABI25_0_0EXAudioRecordingPermissionRequester permissions];
  } else if ([type isEqualToString:@"systemBrightness"]) {
    return [ABI25_0_0EXPermissions alwaysGrantedPermissions]; // permission is implicit
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [ABI25_0_0EXCameraRollRequester permissions];
  } else if ([type isEqualToString:@"calendar"]) {
    return [ABI25_0_0EXCalendarRequester permissions];
  } else if ([type isEqualToString:@"reminders"]) {
    return [ABI25_0_0EXRemindersRequester permissions];
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
  
  [ABI25_0_0RCTPresentedViewController() presentViewController:alert animated:YES completion:nil];
}

+ (NSDictionary *)alwaysGrantedPermissions {
  return @{
    @"status": [ABI25_0_0EXPermissions permissionStringForStatus:ABI25_0_0EXPermissionStatusGranted],
    @"expires": ABI25_0_0EXPermissionExpiresNever,
  };
}

+ (NSString *)permissionStringForStatus:(ABI25_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI25_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI25_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (ABI25_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions
{
  NSString *status = permissions[@"status"];
  if ([status isEqualToString:@"granted"]) {
    return ABI25_0_0EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return ABI25_0_0EXPermissionStatusDenied;
  } else {
    return ABI25_0_0EXPermissionStatusUndetermined;
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

+ (NSString *)typeForRequester:(NSObject<ABI25_0_0EXPermissionRequester> *)requester
{
  if ([requester isKindOfClass:[ABI25_0_0EXLocationRequester class]]) {
    return @"location";
  } else if ([requester isKindOfClass:[ABI25_0_0EXCameraPermissionRequester class]]) {
    return @"camera";
  } else if ([requester isKindOfClass:[ABI25_0_0EXContactsRequester class]]) {
    return @"contacts";
  } else if ([requester isKindOfClass:[ABI25_0_0EXAudioRecordingPermissionRequester class]]) {
    return @"audioRecording";
  } else if ([requester isKindOfClass:[ABI25_0_0EXCameraRollRequester class]]) {
    return @"cameraRoll";
  } else if ([requester isKindOfClass:[ABI25_0_0EXCalendarRequester class]]) {
    return @"calendar";
  } else if ([requester isKindOfClass:[ABI25_0_0EXRemindersRequester class]]) {
    return @"reminders";
  }
  return @"unknown";
}

- (void)permissionsRequester:(NSObject<ABI25_0_0EXPermissionRequester> *)requester didFinishWithResult:(NSDictionary *)requestResult
{
  if ([_requests containsObject:requester]) {
    if (requestResult) {
      [_kernelPermissionsServiceDelegate savePermission:requestResult ofType:[[self class] typeForRequester:requester] forExperience:self.experienceId];
    }
    [_requests removeObject:requester];
  }
}

@end
