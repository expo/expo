// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXLocalNotificationRequester.h"
#import "EXUnversioned.h"

#import "RCTUtils.h"

@interface EXLocalNotificationRequester ()

@property (nonatomic, strong) RCTPromiseResolveBlock resolve;
@property (nonatomic, strong) RCTPromiseRejectBlock reject;
@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

@implementation EXLocalNotificationRequester

+ (NSDictionary *)permissions
{
  UIUserNotificationSettings *currentSettings = RCTSharedApplication().currentUserNotificationSettings;
  
  EXPermissionStatus status = currentSettings != UIUserNotificationTypeNone ?
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
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_handleDidRegisterForLocalNotifications:)
                                               name:EX_UNVERSIONED(@"EXAppDidRegisterUserNotificationSettings")
                                             object:nil];
  
  UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
  [RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

- (void)_handleDidRegisterForLocalNotifications:(__unused UIUserNotificationSettings *)notificationSettings
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
