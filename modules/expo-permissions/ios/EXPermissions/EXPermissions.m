// Copyright 2016-present 650 Industries. All rights reserved.

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

@end

@implementation EXPermissions

EX_REGISTER_MODULE(ExponentPermissions, Permissions);

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

EX_EXPORT_METHOD_AS(getAsync,
                    getCurrentPermissionsWithType:(NSString *)type
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if ([type isEqualToString:@"notifications"]) {
    resolve([EXRemoteNotificationRequester permissions]);
  } else if ([type isEqualToString:@"userFacingNotifications"]) {
    resolve([EXLocalNotificationRequester permissions]);
  } else if ([type isEqualToString:@"location"]) {
    resolve([EXLocationRequester permissions]);
  } else if ([type isEqualToString:@"camera"]) {
    resolve([EXCameraPermissionRequester permissions]);
  } else if ([type isEqualToString:@"contacts"]) {
    resolve([EXContactsRequester permissions]);
  } else if ([type isEqualToString:@"audioRecording"]) {
    resolve([EXAudioRecordingPermissionRequester permissions]);
  } else if ([type isEqualToString:@"systemBrightness"]) {
    resolve([EXPermissions alwaysGrantedPermissions]); // permission is implicit
  } else if ([type isEqualToString:@"cameraRoll"]) {
    resolve([EXCameraRollRequester permissions]);
  } else if ([type isEqualToString:@"calendar"]) {
    resolve([EXCalendarRequester permissions]);
  } else if ([type isEqualToString:@"reminders"]) {
    resolve([EXRemindersRequester permissions]);
  } else {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
  }
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
  } else if ([type isEqualToString:@"systemBrightness"]) {
    return [EXPermissions alwaysGrantedPermissions]; // permission is implicit
  } else if ([type isEqualToString:@"cameraRoll"]) {
    return [EXCameraRollRequester permissions];
  } else if ([type isEqualToString:@"calendar"]) {
    return [EXCalendarRequester permissions];
  } else if ([type isEqualToString:@"reminders"]) {
    return [EXRemindersRequester permissions];
  } else {
    return nil;
  }
}

EX_EXPORT_METHOD_AS(askAsync,
                    askForPermissionsWithType:(NSString *)type
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [self getCurrentPermissionsWithType:type resolver:^(NSDictionary *result) {
    if (result && [result[@"status"] isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusGranted]]) {
      // if we already have permission granted, resolve immediately with that
      resolve(result);
    } else {
      NSObject<EXPermissionRequester> *requester;
      if ([type isEqualToString:@"notifications"]) {
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
  } rejecter:reject];
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

- (void)permissionRequesterDidFinish:(NSObject<EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
