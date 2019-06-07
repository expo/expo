//  Copyright © 2019-present 650 Industries. All rights reserved.

#ifndef EXNotificationRepository_h
#define EXNotificationRepository_h

@protocol EXNotificationRepository <NSObject>

- (void)addForegroundNotificationForAppId:(NSString*)appId foregroundNotification:(NSDictionary*)foregroundNotification;

- (void)addUserInteractionForAppId:(NSString*)appId userInteraction:(NSDictionary*)userInteraction;

- (NSArray<NSDictionary*>*)getForegroundNotificationsForAppId:(NSString*)appId;

- (NSArray<NSDictionary*>*)getUserInterationsForAppId:(NSString*)appId;

@end

#endif /* EXNotificationRepository_h */
