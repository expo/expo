// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXRemoteNotificationRequester.h"
#import "ABI24_0_0EXUnversioned.h"

#import <ReactABI24_0_0/ABI24_0_0RCTUtils.h>

@interface ABI24_0_0EXRemoteNotificationRequester ()

@property (nonatomic, strong) ABI24_0_0RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI24_0_0RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI24_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI24_0_0EXRemoteNotificationRequester

+ (NSDictionary *)permissions
{
  ABI24_0_0EXPermissionStatus status = (ABI24_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) ?
    ABI24_0_0EXPermissionStatusGranted :
    ABI24_0_0EXPermissionStatusUndetermined;
  return @{
           @"status": [ABI24_0_0EXPermissions permissionStringForStatus:status],
           @"expires": ABI24_0_0EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(ABI24_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI24_0_0RCTPromiseRejectBlock)reject
{
  _resolve = resolve;
  _reject = reject;
  
  if (ABI24_0_0RCTSharedApplication().isRegisteredForRemoteNotifications) {
    // resolve immediately if already registered
    [self _consumeResolverWithCurrentPermissions];
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                                 name:@"kEXAppDidRegisterForRemoteNotificationsNotification"
                                               object:nil];
    UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
    [ABI24_0_0RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
    [ABI24_0_0RCTSharedApplication() registerForRemoteNotifications];
  }
}

- (void)setDelegate:(id<ABI24_0_0EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

- (void)_handleDidRegisterForRemoteNotifications:(__unused NSNotification *)notif
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self _consumeResolverWithCurrentPermissions];
}

- (void)_consumeResolverWithCurrentPermissions
{
  if (_resolve) {
    _resolve([[self class] permissions]);
    _resolve = nil;
    _reject = nil;
  }
  if (_delegate) {
    [_delegate permissionsRequester:self didFinishWithResult:nil];
  }
}

@end
