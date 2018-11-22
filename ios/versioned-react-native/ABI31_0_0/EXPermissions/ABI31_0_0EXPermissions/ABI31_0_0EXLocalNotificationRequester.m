// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI31_0_0EXPermissions/ABI31_0_0EXLocalNotificationRequester.h>
//#import "ABI31_0_0EXUnversioned.h"

#import <UIKit/UIKit.h>

@interface ABI31_0_0EXLocalNotificationRequester ()

@property (nonatomic, strong) ABI31_0_0EXPromiseResolveBlock resolve;
@property (nonatomic, strong) ABI31_0_0EXPromiseRejectBlock reject;
@property (nonatomic, weak) id<ABI31_0_0EXPermissionRequesterDelegate> delegate;

@end

@implementation ABI31_0_0EXLocalNotificationRequester

+ (NSDictionary *)permissions
{
  BOOL allowsSound = [ABI31_0_0EXLocalNotificationRequester notificationTypeIsAllowed:UIUserNotificationTypeSound];
  BOOL allowsAlert = [ABI31_0_0EXLocalNotificationRequester notificationTypeIsAllowed:UIUserNotificationTypeAlert];
  BOOL allowsBadge = [ABI31_0_0EXLocalNotificationRequester notificationTypeIsAllowed:UIUserNotificationTypeBadge];
  
  ABI31_0_0EXPermissionStatus status = ABI31_0_0EXPermissionStatusUndetermined;
  
  // If the user allowed alerts we say that notifications are allowed
  if (allowsAlert) {
    status = ABI31_0_0EXPermissionStatusGranted;
  } else if (!allowsBadge && !allowsSound) {
    // However, if none of the notification types is allowed, we say the permission has been denied
    status = ABI31_0_0EXPermissionStatusDenied;
  }

  return @{
           @"status": [ABI31_0_0EXPermissions permissionStringForStatus:status],
           @"allowsSound": @(allowsSound),
           @"allowsAlert": @(allowsAlert),
           @"allowsBadge": @(allowsBadge),
           @"expires": ABI31_0_0EXPermissionExpiresNever,
           };
}

+ (BOOL)notificationTypeIsAllowed:(UIUserNotificationType)type
{
  UIUserNotificationSettings *currentSettings = ABI31_0_0EXSharedApplication().currentUserNotificationSettings;
  return (currentSettings.types & type) != 0;
}

- (void)requestPermissionsWithResolver:(ABI31_0_0EXPromiseResolveBlock)resolve rejecter:(ABI31_0_0EXPromiseRejectBlock)reject
{
  if (_resolve != nil || _reject != nil) {
    reject(@"E_AWAIT_PROMISE", @"Another request for the same permission is already being handled.", nil);
    return;
  }

  _resolve = resolve;
  _reject = reject;
  
  if ([ABI31_0_0EXLocalNotificationRequester notificationTypeIsAllowed:UIUserNotificationTypeAlert]) {
    // resolve immediately if already allowed
    [self _consumeResolverWithCurrentPermissions];
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleDidRegisterUserNotificationSettings:)
                                                 name:@"kEXAppDidRegisterUserNotificationSettingsNotification"
                                               object:nil];
    UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
    [ABI31_0_0EXSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
  }
}

- (void)setDelegate:(id<ABI31_0_0EXPermissionRequesterDelegate>)delegate
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
    [_delegate permissionRequesterDidFinish:self];
  }
}

@end
