// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI12_0_0EXRemoteNotificationRequester.h"
#import "ABI12_0_0EXUnversioned.h"

#import "ABI12_0_0RCTUtils.h"

@interface ABI12_0_0EXRemoteNotificationRequester ()

@property (nonatomic, strong) ABI12_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI12_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI12_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI12_0_0EXRemoteNotificationRequester

+ (NSDictionary *)permissions
{
  ABI12_0_0EXPermissionStatus status = (ABI12_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI12_0_0EXPermissionStatusGranted :
    ABI12_0_0EXPermissionStatusUndetermined;
  return @{
           @"status": [ABI12_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI12_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI12_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI12_0_0RCTPromiseRejectBlock)reject
{
  _resolve = resolve;
  _reject = reject;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                               name:@"EXAppDidRegisterForRemoteNotificationsNotification"
                                             object:nil];
  UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
  [ABI12_0_0RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
  [ABI12_0_0RCTSharedApplication() registerForRemoteNotifications];
}

- (void)setDelegate:(id<ABI12_0_0EXPermissionRequesterDelegate>)delegate
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
