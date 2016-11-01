// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI11_0_0EXRemoteNotificationRequester.h"
#import "ABI11_0_0EXUnversioned.h"

#import "ABI11_0_0RCTUtils.h"

@interface ABI11_0_0EXRemoteNotificationRequester ()

@property (nonatomic, strong) ABI11_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI11_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI11_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI11_0_0EXRemoteNotificationRequester

+ (NSDictionary *)permissions
{
  ABI11_0_0EXPermissionStatus status = (ABI11_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI11_0_0EXPermissionStatusGranted :
    ABI11_0_0EXPermissionStatusUndetermined;
  return @{
           @"status": [ABI11_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI11_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI11_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI11_0_0RCTPromiseRejectBlock)reject
{
  _resolve = resolve;
  _reject = reject;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                               name:@"EXAppDidRegisterForRemoteNotificationsNotification"
                                             object:nil];
  UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
  [ABI11_0_0RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
  [ABI11_0_0RCTSharedApplication() registerForRemoteNotifications];
}

- (void)setDelegate:(id<ABI11_0_0EXPermissionRequesterDelegate>)delegate
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
