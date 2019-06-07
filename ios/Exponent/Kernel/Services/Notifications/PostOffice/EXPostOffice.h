//  Copyright © 2019-present 650 Industries. All rights reserved.

#ifndef EXPostOffice_h
#define EXPostOffice_h

#import "EXMailbox.h"

@protocol EXPostOffice <NSObject>

- (void)notifyAboutUserInteractionForExperienceId:(NSString*)experienceId userInteraction:(NSDictionary*)userInteraction;

- (void)notifyAboutForegroundNotificationForExperienceId:(NSString*)experienceId notification:(NSDictionary*)notification;

- (void)registerModuleAndGetPendingDeliveriesWithExperienceId:(NSString*)experienceId mailbox:(id<EXMailbox>)mailbox;

- (void)unregisterModuleWithExperienceId:(NSString*)experienceId;

@end

#endif /* EXPostOffice_h */
