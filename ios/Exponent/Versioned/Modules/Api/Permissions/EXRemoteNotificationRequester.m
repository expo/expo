// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXRemoteNotificationRequester.h"
#import "EXUnversioned.h"

#import <React/RCTUtils.h>

@interface EXRemoteNotificationRequester ()

@property (nonatomic, strong) RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

@implementation EXRemoteNotificationRequester

+ (NSDictionary *)permissions
{
  EXPermissionStatus status = (RCTSharedApplication().isRegisteredForRemoteNotifications) ?
    EXPermissionStatusGranted :
    EXPermissionStatusUndetermined;
  return @{
           @"status": [EXPermissions permissionStringForStatus:status],
           @"expires": EXPermissionExpiresNever,
           };
}

- (void)requestPermissionsWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject
{
  _resolve = resolve;
  _reject = reject;
  
  if (RCTSharedApplication().isRegisteredForRemoteNotifications) {
    // resolve immediately if already registered
    [self _consumeResolverWithCurrentPermissions];
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleDidRegisterForRemoteNotifications:)
                                                 name:EX_UNVERSIONED(@"EXAppDidRegisterForRemoteNotificationsNotification")
                                               object:nil];
    UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
    [RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
    [RCTSharedApplication() registerForRemoteNotifications];
  }
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
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
    [_delegate permissionRequesterDidFinish:self];
  }
}

@end
