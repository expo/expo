//  Copyright © 2019-present 650 Industries. All rights reserved.

#ifndef EXNotificationRepository_h
#define EXNotificationRepository_h

@protocol EXNotificationRepository <NSObject>

- (void)addForegroundNotificationForExperienceId:(NSString*)experienceId foregroundNotification:(NSDictionary*)foregroundNotification;

- (void)addUserInteractionForExperienceId:(NSString*)experienceId userInteraction:(NSDictionary*)userInteraction;

- (NSArray<NSDictionary*>*)getForegroundNotificationsForExperienceId:(NSString*)experienceId;

- (NSArray<NSDictionary*>*)getUserInterationsForExperienceId:(NSString*)experienceId;

@end

#endif /* EXNotificationRepository_h */
