// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI10_0_0EXRemoteNotificationRequester.h"
#import "ABI10_0_0RCTUtils.h"

@interface ABI10_0_0EXRemoteNotificationRequester ()

@property (nonatomic, strong) ABI10_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI10_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI10_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI10_0_0EXRemoteNotificationRequester

+ (NSDictionary *)permissions
{
  ABI10_0_0EXPermissionStatus status = (ABI10_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI10_0_0EXPermissionStatusGranted :
    ABI10_0_0EXPermissionStatusUndetermined;
  return @{
           @"status": [ABI10_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI10_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI10_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI10_0_0RCTPromiseRejectBlock)reject
{
  _resolve = resolve;
  _reject = reject;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                               name:@"EXAppDidRegisterForRemoteNotificationsNotification"
                                             object:nil];
  UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
  [ABI10_0_0RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
  [ABI10_0_0RCTSharedApplication() registerForRemoteNotifications];
}

- (void)setDelegate:(id<ABI10_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

- (void)_handleDidRegisterForRemoteNotifications:(__unused NSNotification *)notif
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  if (_resolve) {
    _resolve([[self class] permissions]);
    _resolve = nil;
    _reject = nil;
  }
  if (_delegate) {
    [_delegate permissionRequesterDidFinish:self];
  }
}

@end
