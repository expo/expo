// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXAudioRecordingPermissionRequester.h"
#import "EXCameraPermissionRequester.h"
#import "EXContactsRequester.h"
#import "EXLocationRequester.h"
#import "EXPermissions.h"
#import "EXRemoteNotificationRequester.h"
#import "EXCameraRollRequester.h"

NSString * const EXPermissionExpiresNever = @"never";

@interface EXPermissions ()

@property (nonatomic, strong) NSMutableArray *requests;

@end

@implementation EXPermissions

RCT_EXPORT_MODULE(ExponentPermissions);

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

RCT_REMAP_METHOD(getAsync,
                 getCurrentPermissionsWithType:(NSString *)type
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([type isEqualToString:@"remoteNotifications"]) {
    resolve([EXRemoteNotificationRequester permissions]);
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
  } else {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
  }
}

RCT_REMAP_METHOD(askAsync,
                 askForPermissionsWithType:(NSString *)type
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self getCurrentPermissionsWithType:type resolver:^(NSDictionary *result) {
    if (result && [result[@"status"] isEqualToString:[EXPermissions permissionStringForStatus:EXPermissionStatusGranted]]) {
      // if we already have permission granted, resolve immediately with that
      resolve(result);
    } else {
      NSObject<EXPermissionRequester> *requester;
      if ([type isEqualToString:@"remoteNotifications"]) {
        requester = [[EXRemoteNotificationRequester alloc] init];
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
