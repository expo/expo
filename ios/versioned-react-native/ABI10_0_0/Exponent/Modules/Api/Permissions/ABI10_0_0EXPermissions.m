// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI10_0_0EXPermissions.h"
#import "ABI10_0_0EXLocationRequester.h"
#import "ABI10_0_0EXRemoteNotificationRequester.h"

NSString * const ABI10_0_0EXPermissionExpiresNever = @"never";

@interface ABI10_0_0EXPermissions ()

@property (nonatomic, strong) NSMutableArray *requests;

@end

@implementation ABI10_0_0EXPermissions

ABI10_0_0RCT_EXPORT_MODULE(ExponentPermissions);

- (instancetype)init
{
  if (self = [super init]) {
    _requests = [NSMutableArray array];
  }
  return self;
}

ABI10_0_0RCT_REMAP_METHOD(getAsync,
                 getCurrentPermissionsWithType:(NSString *)type
                 resolver:(ABI10_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI10_0_0RCTPromiseRejectBlock)reject)
{
  if ([type isEqualToString:@"remoteNotifications"]) {
    resolve([ABI10_0_0EXRemoteNotificationRequester permissions]);
  } else if ([type isEqualToString:@"location"]) {
    resolve([ABI10_0_0EXLocationRequester permissions]);
  } else {
    reject(@"E_PERMISSION_UNKNOWN", [NSString stringWithFormat:@"Unrecognized permission: %@", type], nil);
  }
}

ABI10_0_0RCT_REMAP_METHOD(askAsync,
                 askForPermissionsWithType:(NSString *)type
                 resolver:(ABI10_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI10_0_0RCTPromiseRejectBlock)reject)
{
  [self getCurrentPermissionsWithType:type resolver:^(NSDictionary *result) {
    if (result && [result[@"status"] isEqualToString:[ABI10_0_0EXPermissions permissionStringForStatus:ABI10_0_0EXPermissionStatusGranted]]) {
      // if we already have permission granted, resolve immediately with that
      resolve(result);
    } else {
      NSObject<ABI10_0_0EXPermissionRequester> *requester;
      if ([type isEqualToString:@"remoteNotifications"]) {
        requester = [[ABI10_0_0EXRemoteNotificationRequester alloc] init];
      } else if ([type isEqualToString:@"location"]) {
        requester = [[ABI10_0_0EXLocationRequester alloc] init];
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

+ (NSString *)permissionStringForStatus:(ABI10_0_0EXPermissionStatus)status
{
  switch (status) {
    case ABI10_0_0EXPermissionStatusGranted:
      return @"granted";
    case ABI10_0_0EXPermissionStatusDenied:
      return @"denied";
    default:
      return @"undetermined";
  }
}

- (void)permissionRequesterDidFinish:(NSObject<ABI10_0_0EXPermissionRequester> *)requester
{
  if ([_requests containsObject:requester]) {
    [_requests removeObject:requester];
  }
}

@end
