// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNotifications/EXBadgeModule.h>
#import <ExpoModulesCore/EXUtilities.h>
#import <UserNotifications/UserNotifications.h>

@implementation EXBadgeModule

EX_EXPORT_MODULE(ExpoBadgeModule)

EX_EXPORT_METHOD_AS(getBadgeCountAsync,
                    getBadgeCountAsync:(EXPromiseResolveBlock)resolve reject:(EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([EXSharedApplication() applicationIconBadgeNumber]));
  });
}

EX_EXPORT_METHOD_AS(setBadgeCountAsync,
                    setBadgeCountAsync:(NSNumber *)badgeCount
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (settings.badgeSetting == UNNotificationSettingEnabled) {
        [EXSharedApplication() setApplicationIconBadgeNumber:badgeCount.integerValue];
        resolve(@(YES));
      } else {
        resolve(@(NO));
      }
    });
  }];
}

@end
