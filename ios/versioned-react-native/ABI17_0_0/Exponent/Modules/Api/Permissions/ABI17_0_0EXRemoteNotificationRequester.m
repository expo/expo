// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI17_0_0EXRemoteNotificationRequester.h"
#import "ABI17_0_0EXUnversioned.h"

#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>

@interface ABI17_0_0EXRemoteNotificationRequester ()

@property (nonatomic, strong) ABI17_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI17_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI17_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI17_0_0EXRemoteNotificationRequester

+ (NSDictionary *)permissions
{
  ABI17_0_0EXPermissionStatus status = (ABI17_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI17_0_0EXPermissionStatusGranted :
    ABI17_0_0EXPermissionStatusUndetermined;
  return @{
           @"status": [ABI17_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI17_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI17_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject
{
  _resolve = resolve;
  _reject = reject;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                               name:@"EXAppDidRegisterForRemoteNotificationsNotification"
                                             object:nil];
  UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
  [ABI17_0_0RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
  [ABI17_0_0RCTSharedApplication() registerForRemoteNotifications];
}

- (void)setDelegate:(id<ABI17_0_0EXPermissionRequesterDelegate>)delegate
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
