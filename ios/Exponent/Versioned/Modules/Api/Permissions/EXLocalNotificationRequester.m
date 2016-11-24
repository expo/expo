// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXLocalNotificationRequester.h"
#import "RCTUtils.h"

@interface EXLocalNotificationRequester ()

@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end

@implementation EXLocalNotificationRequester

+ (NSDictionary *)permissions
{
  UIUserNotificationSettings *currentSettings = RCTSharedApplication().currentUserNotificationSettings;
  
  EXPermissionStatus status = currentSettings != UIUserNotificationTypeNone
    ? EXPermissionStatusGranted
    : EXPermissionStatusUndetermined;
  
  return @{
    @"status": [EXPermissions permissionStringForStatus:status],
    @"expires": EXPermissionExpiresNever,
  };
}

- (void)requestPermissionsWithResolver:(RCTPromiseResolveBlock)resolve rejecter:(__unused RCTPromiseRejectBlock)reject
{
  UIUserNotificationType types = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
  [RCTSharedApplication() registerUserNotificationSettings:[UIUserNotificationSettings settingsForTypes:types categories:nil]];
  
  resolve([[self class] permissions]);
  [_delegate permissionRequesterDidFinish:self];
}

- (void)setDelegate:(id<EXPermissionRequesterDelegate>)delegate
{
  _delegate = delegate;
}

@end
