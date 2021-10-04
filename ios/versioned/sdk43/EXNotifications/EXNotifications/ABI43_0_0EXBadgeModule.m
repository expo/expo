// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXNotifications/ABI43_0_0EXBadgeModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>
#import <UserNotifications/UserNotifications.h>

@implementation ABI43_0_0EXBadgeModule

ABI43_0_0EX_EXPORT_MODULE(ExpoBadgeModule)

ABI43_0_0EX_EXPORT_METHOD_AS(getBadgeCountAsync,
                    getBadgeCountAsync:(ABI43_0_0EXPromiseResolveBlock)resolve reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([ABI43_0_0EXSharedApplication() applicationIconBadgeNumber]));
  });
}

ABI43_0_0EX_EXPORT_METHOD_AS(setBadgeCountAsync,
                    setBadgeCountAsync:(NSNumber *)badgeCount
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (settings.badgeSetting == UNNotificationSettingEnabled) {
        [ABI43_0_0EXSharedApplication() setApplicationIconBadgeNumber:badgeCount.integerValue];
        resolve(@(YES));
      } else {
        resolve(@(NO));
      }
    });
  }];
}

@end
