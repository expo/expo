// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI8_0_0EXRemoteNotificationRequester.h"
#import "ABI8_0_0RCTUtils.h"

@interface ABI8_0_0EXRemoteNotificationRequester ()

@property (nonatomic, strong) ABI8_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI8_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI8_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI8_0_0EXRemoteNotificationRequester

+ (NSDictionary *)permissions
{
  ABI8_0_0EXPermissionStatus status = (ABI8_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI8_0_0EXPermissionStatusGranted :
    ABI8_0_0EXPermissionStatusUndetermined;
  return @{
           @"status": [ABI8_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI8_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI8_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI8_0_0RCTPromiseRejectBlock)reject
{
  _resolve = resolve;
  _reject = reject;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                               name:@"EXAppDidRegisterForRemoteNotificationsNotification"
                                             object:nil];
  UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
  [ABI8_0_0RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
  [ABI8_0_0RCTSharedApplication() registerForRemoteNotifications];
}

- (void)setDelegate:(id<ABI8_0_0EXPermissionRequesterDelegate>)delegate
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
