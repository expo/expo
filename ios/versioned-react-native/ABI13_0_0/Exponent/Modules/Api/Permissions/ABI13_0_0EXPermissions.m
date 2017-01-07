// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI13_0_0EXPermissions.h"
#import "ABI13_0_0EXLocationRequester.h"
#import "ABI13_0_0EXRemoteNotificationRequester.h"
#import "ABI13_0_0EXAVPermissionRequester.h"

NSString * const ABI13_0_0EXPermissionExpiresNever = @"never";

@interface ABI13_0_0EXPermissions ()

@property (nonatomic, strong) NSMutableArray *requests;

@end

@implementation ABI13_0_0EXPermissions

ABI13_0_0RCT_EXPORT_MODULE(ExponentPermissions);

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

ABI13_0_0RCT_REMAP_METHOD(getAsync,
                 getCurrentPermissionsWithType:(NSString *)type
                 resolver:(ABI13_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI13_0_0RCTPromiseRejectBlock)reject)
{
  if ([type isEqualToString:@"remoteNotifications"]) {
    resolve([ABI13_0_0EXRemoteNotificationRequester permissions]);
  } else if ([type isEqualToString:@"location"]) {
    resolve([ABI13_0_0EXLocationRequester permissions]);
  } else if ([type isEqualToString:@"camera"]) {
    resolve([ABI13_0_0EXAVPermissionRequester permissions]);
  } else {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
  }
}

ABI13_0_0RCT_REMAP_METHOD(askAsync,
                 askForPermissionsWithType:(NSString *)type
                 resolver:(ABI13_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI13_0_0RCTPromiseRejectBlock)reject)
{
  [self getCurrentPermissionsWithType:type resolver:^(NSDictionary *result) {
    if (result && [result[@"status"] isEqualToString:[ABI13_0_0EXPermissions permissionStringForStatus:ABI13_0_0EXPermissionStatusGranted]]) {
      // if we already have permission granted, resolve immediately with that
      resolve(result);
    } else {
      NSObject<ABI13_0_0EXPermissionRequester> *requester;
      if ([type isEqualToString:@"remoteNotifications"]) {
        requester = [[ABI13_0_0EXRemoteNotificationRequester alloc] init];
      } else if ([type isEqualToString:@"location"]) {
        requester = [[ABI13_0_0EXLocationRequester alloc] init];
      } else if ([type isEqualToString:@"camera"]) {
        requester = [[ABI13_0_0EXAVPermissionRequester alloc] init];
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
    @"status": [ABI13_0_0EXPermissions permissionStringForStatus:ABI13_0_0EXPermissionStatusGranted],
    @"expires": ABI13_0_0EXPermissionExpiresNever,
  };
}

+ (NSString *)permissionStringForStatus:(ABI13_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI13_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI13_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

- (void)permissionRequesterDidFinish:(NSObject<ABI13_0_0EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
