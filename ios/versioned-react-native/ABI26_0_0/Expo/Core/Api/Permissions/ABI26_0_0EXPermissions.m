// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXAudioRecordingPermissionRequester.h"
#import "ABI26_0_0EXCalendarRequester.h"
#import "ABI26_0_0EXCameraPermissionRequester.h"
#import "ABI26_0_0EXContactsRequester.h"
#import "ABI26_0_0EXLocationRequester.h"
#import "ABI26_0_0EXPermissions.h"
#import "ABI26_0_0EXLocalNotificationRequester.h"
#import "ABI26_0_0EXRemindersRequester.h"
#import "ABI26_0_0EXRemoteNotificationRequester.h"
#import "ABI26_0_0EXCameraRollRequester.h"

NSString * const ABI26_0_0EXPermissionExpiresNever = @"never";

@interface ABI26_0_0EXPermissions ()

@property (nonatomic, strong) NSMutableArray *requests;

@end

@implementation ABI26_0_0EXPermissions

ABI26_0_0RCT_EXPORT_MODULE(ExponentPermissions);

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

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI26_0_0RCT_REMAP_METHOD(getAsync,
                 getCurrentPermissionsWithType:(NSString *)type
                 resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  if ([type isEqualToString:@"notifications"]) {
    resolve([ABI26_0_0EXRemoteNotificationRequester permissions]);
  } else if ([type isEqualToString:@"userFacingNotifications"]) {
    resolve([ABI26_0_0EXLocalNotificationRequester permissions]);
  } else if ([type isEqualToString:@"location"]) {
    resolve([ABI26_0_0EXLocationRequester permissions]);
  } else if ([type isEqualToString:@"camera"]) {
    resolve([ABI26_0_0EXCameraPermissionRequester permissions]);
  } else if ([type isEqualToString:@"contacts"]) {
    resolve([ABI26_0_0EXContactsRequester permissions]);
  } else if ([type isEqualToString:@"audioRecording"]) {
    resolve([ABI26_0_0EXAudioRecordingPermissionRequester permissions]);
  } else if ([type isEqualToString:@"systemBrightness"]) {
    resolve([ABI26_0_0EXPermissions alwaysGrantedPermissions]); // permission is implicit
  } else if ([type isEqualToString:@"cameraRoll"]) {
    resolve([ABI26_0_0EXCameraRollRequester permissions]);
  } else if ([type isEqualToString:@"calendar"]) {
    resolve([ABI26_0_0EXCalendarRequester permissions]);
  } else if ([type isEqualToString:@"reminders"]) {
    resolve([ABI26_0_0EXRemindersRequester permissions]);
  } else {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
  }
}

ABI26_0_0RCT_REMAP_METHOD(askAsync,
                 askForPermissionsWithType:(NSString *)type
                 resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  [self getCurrentPermissionsWithType:type resolver:^(NSDictionary *result) {
    if (result && [result[@"status"] isEqualToString:[ABI26_0_0EXPermissions permissionStringForStatus:ABI26_0_0EXPermissionStatusGranted]]) {
      // if we already have permission granted, resolve immediately with that
      resolve(result);
    } else {
      NSObject<ABI26_0_0EXPermissionRequester> *requester;
      if ([type isEqualToString:@"notifications"]) {
        requester = [[ABI26_0_0EXRemoteNotificationRequester alloc] init];
      } else if ([type isEqualToString:@"userFacingNotifications"]) {
        requester = [[ABI26_0_0EXLocalNotificationRequester alloc] init];
      } else if ([type isEqualToString:@"location"]) {
        requester = [[ABI26_0_0EXLocationRequester alloc] init];
      } else if ([type isEqualToString:@"camera"]) {
        requester = [[ABI26_0_0EXCameraPermissionRequester alloc] init];
      } else if ([type isEqualToString:@"contacts"]) {
        requester = [[ABI26_0_0EXContactsRequester alloc] init];
      } else if ([type isEqualToString:@"audioRecording"]) {
        requester = [[ABI26_0_0EXAudioRecordingPermissionRequester alloc] init];
      } else if ([type isEqualToString:@"cameraRoll"]) {
        requester = [[ABI26_0_0EXCameraRollRequester alloc] init];
      } else if ([type isEqualToString:@"calendar"]) {
        requester = [[ABI26_0_0EXCalendarRequester alloc] init];
      } else if ([type isEqualToString:@"reminders"]) {
        requester = [[ABI26_0_0EXRemindersRequester alloc] init];
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
    @"status": [ABI26_0_0EXPermissions permissionStringForStatus:ABI26_0_0EXPermissionStatusGranted],
    @"expires": ABI26_0_0EXPermissionExpiresNever,
  };
}

+ (NSString *)permissionStringForStatus:(ABI26_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI26_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI26_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (ABI26_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions
{
  NSString *status = permissions[@"status"];
  if ([status isEqualToString:@"granted"]) {
    return ABI26_0_0EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return ABI26_0_0EXPermissionStatusDenied;
  } else {
    return ABI26_0_0EXPermissionStatusUndetermined;
  }
}

- (void)permissionRequesterDidFinish:(NSObject<ABI26_0_0EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
