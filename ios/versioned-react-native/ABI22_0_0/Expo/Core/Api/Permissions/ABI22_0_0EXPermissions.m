// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXAudioRecordingPermissionRequester.h"
#import "ABI22_0_0EXCameraPermissionRequester.h"
#import "ABI22_0_0EXContactsRequester.h"
#import "ABI22_0_0EXLocationRequester.h"
#import "ABI22_0_0EXPermissions.h"
#import "ABI22_0_0EXRemoteNotificationRequester.h"

NSString * const ABI22_0_0EXPermissionExpiresNever = @"never";

@interface ABI22_0_0EXPermissions ()

@property (nonatomic, strong) NSMutableArray *requests;

@end

@implementation ABI22_0_0EXPermissions

ABI22_0_0RCT_EXPORT_MODULE(ExponentPermissions);

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

ABI22_0_0RCT_REMAP_METHOD(getAsync,
                 getCurrentPermissionsWithType:(NSString *)type
                 resolver:(ABI22_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI22_0_0RCTPromiseRejectBlock)reject)
{
  if ([type isEqualToString:@"remoteNotifications"]) {
    resolve([ABI22_0_0EXRemoteNotificationRequester permissions]);
  } else if ([type isEqualToString:@"location"]) {
    resolve([ABI22_0_0EXLocationRequester permissions]);
  } else if ([type isEqualToString:@"camera"]) {
    resolve([ABI22_0_0EXCameraPermissionRequester permissions]);
  } else if ([type isEqualToString:@"contacts"]) {
    resolve([ABI22_0_0EXContactsRequester permissions]);
  } else if ([type isEqualToString:@"audioRecording"]) {
    resolve([ABI22_0_0EXAudioRecordingPermissionRequester permissions]);
  } else if ([type isEqualToString:@"systemBrightness"]) {
    resolve([ABI22_0_0EXPermissions alwaysGrantedPermissions]); // permission is implicit
  } else {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
  }
}

ABI22_0_0RCT_REMAP_METHOD(askAsync,
                 askForPermissionsWithType:(NSString *)type
                 resolver:(ABI22_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI22_0_0RCTPromiseRejectBlock)reject)
{
  [self getCurrentPermissionsWithType:type resolver:^(NSDictionary *result) {
    if (result && [result[@"status"] isEqualToString:[ABI22_0_0EXPermissions permissionStringForStatus:ABI22_0_0EXPermissionStatusGranted]]) {
      // if we already have permission granted, resolve immediately with that
      resolve(result);
    } else {
      NSObject<ABI22_0_0EXPermissionRequester> *requester;
      if ([type isEqualToString:@"remoteNotifications"]) {
        requester = [[ABI22_0_0EXRemoteNotificationRequester alloc] init];
      } else if ([type isEqualToString:@"location"]) {
        requester = [[ABI22_0_0EXLocationRequester alloc] init];
      } else if ([type isEqualToString:@"camera"]) {
        requester = [[ABI22_0_0EXCameraPermissionRequester alloc] init];
      } else if ([type isEqualToString:@"contacts"]) {
        requester = [[ABI22_0_0EXContactsRequester alloc] init];
      } else if ([type isEqualToString:@"audioRecording"]) {
        requester = [[ABI22_0_0EXAudioRecordingPermissionRequester alloc] init];
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
    @"status": [ABI22_0_0EXPermissions permissionStringForStatus:ABI22_0_0EXPermissionStatusGranted],
    @"expires": ABI22_0_0EXPermissionExpiresNever,
  };
}

+ (NSString *)permissionStringForStatus:(ABI22_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI22_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI22_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

+ (ABI22_0_0EXPermissionStatus)statusForPermissions:(NSDictionary *)permissions
{
  NSString *status = permissions[@"status"];
  if ([status isEqualToString:@"granted"]) {
    return ABI22_0_0EXPermissionStatusGranted;
  } else if ([status isEqualToString:@"denied"]) {
    return ABI22_0_0EXPermissionStatusDenied;
  } else {
    return ABI22_0_0EXPermissionStatusUndetermined;
  }
}

- (void)permissionRequesterDidFinish:(NSObject<ABI22_0_0EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
