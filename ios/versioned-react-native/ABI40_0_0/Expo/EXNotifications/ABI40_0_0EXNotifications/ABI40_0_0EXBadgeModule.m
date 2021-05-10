// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXNotifications/ABI40_0_0EXBadgeModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMUtilities.h>
#import <UserNotifications/UserNotifications.h>

@implementation ABI40_0_0EXBadgeModule

ABI40_0_0UM_EXPORT_MODULE(ExpoBadgeModule)

ABI40_0_0UM_EXPORT_METHOD_AS(getBadgeCountAsync,
                    getBadgeCountAsync:(ABI40_0_0UMPromiseResolveBlock)resolve reject:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([ABI40_0_0UMSharedApplication() applicationIconBadgeNumber]));
  });
}

ABI40_0_0UM_EXPORT_METHOD_AS(setBadgeCountAsync,
                    setBadgeCountAsync:(NSNumber *)badgeCount
                    resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (settings.badgeSetting == UNNotificationSettingEnabled) {
        [ABI40_0_0UMSharedApplication() setApplicationIconBadgeNumber:badgeCount.integerValue];
        resolve(@(YES));
      } else {
        resolve(@(NO));
      }
    });
  }];
}

@end
