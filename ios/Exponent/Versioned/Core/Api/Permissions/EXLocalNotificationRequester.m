// Copyright © 2018 650 Industries. All rights reserved.

#import "EXLocalNotificationRequester.h"
#import "EXUnversioned.h"

#import <UIKit/UIKit.h>
#import <React/RCTUtils.h>

@interface EXLocalNotificationRequester ()

@property (nonatomic, strong) RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

@implementation EXLocalNotificationRequester

+ (NSDictionary *)permissions
{
  BOOL allowsSound = [EXLocalNotificationRequester notificationTypeIsAllowed:UIUserNotificationTypeSound];
  BOOL allowsAlert = [EXLocalNotificationRequester notificationTypeIsAllowed:UIUserNotificationTypeAlert];
  BOOL allowsBadge = [EXLocalNotificationRequester notificationTypeIsAllowed:UIUserNotificationTypeBadge];
  
  EXPermissionStatus status = EXPermissionStatusUndetermined;
  
  // If the user allowed alerts we say that notifications are allowed
  if (allowsAlert) {
    status = EXPermissionStatusGranted;
  } else if (!allowsBadge && !allowsSound) {
    // However, if none of the notification types is allowed, we say the permission has been denied
    status = EXPermissionStatusDenied;
  }

  return @{
           @"status": [EXPermissions permissionStringForStatus:status],
           @"allowsSound": @(allowsSound),
           @"allowsAlert": @(allowsAlert),
           @"allowsBadge": @(allowsBadge),
           @"expires": EXPermissionExpiresNever,
           };
}

+ (BOOL)notificationTypeIsAllowed:(UIUserNotificationType)type
{
  UIUserNotificationSettings *currentSettings = RCTSharedApplication().currentUserNotificationSettings;
  return (currentSettings.types & type) != 0;
}

- (void)requestPermissionsWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_AWAIT_PROMISE", @"Another request for the same permission is already being handled.", nil);
    return;
  }

  _resolve = resolve;
  _reject = reject;
  
  if ([EXLocalNotificationRequester notificationTypeIsAllowed:UIUserNotificationTypeAlert]) {
    // resolve immediately if already allowed
    [self _consumeResolverWithCurrentPermissions];
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleDidRegisterUserNotificationSettings:)
                                                 name:EX_UNVERSIONED(@"EXAppDidRegisterUserNotificationSettingsNotification")
                                               object:nil];
    UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
    [RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
  }
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

- (void)_handleDidRegisterUserNotificationSettings:(__unused NSNotification *)notif
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
