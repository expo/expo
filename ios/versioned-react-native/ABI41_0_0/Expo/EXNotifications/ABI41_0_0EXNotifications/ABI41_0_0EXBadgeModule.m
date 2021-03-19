// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXNotifications/ABI41_0_0EXBadgeModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>
#import <UserNotifications/UserNotifications.h>

@implementation ABI41_0_0EXBadgeModule

ABI41_0_0UM_EXPORT_MODULE(ExpoBadgeModule)

ABI41_0_0UM_EXPORT_METHOD_AS(getBadgeCountAsync,
                    getBadgeCountAsync:(ABI41_0_0UMPromiseResolveBlock)resolve reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([ABI41_0_0UMSharedApplication() applicationIconBadgeNumber]));
  });
}

ABI41_0_0UM_EXPORT_METHOD_AS(setBadgeCountAsync,
                    setBadgeCountAsync:(NSNumber *)badgeCount
                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (settings.badgeSetting == UNNotificationSettingEnabled) {
        [ABI41_0_0UMSharedApplication() setApplicationIconBadgeNumber:badgeCount.integerValue];
        resolve(@(YES));
      } else {
        resolve(@(NO));
      }
    });
  }];
}

@end
