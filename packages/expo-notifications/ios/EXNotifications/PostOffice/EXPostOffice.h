//  Copyright © 2019-present 650 Industries. All rights reserved.

#ifndef EXPostOffice_h
#define EXPostOffice_h

#import "EXMailbox.h"

@protocol EXPostOffice <NSObject>

- (void)notifyAboutUserInteractionForAppId:(NSString*)appId userInteraction:(NSDictionary*)userInteraction;

- (void)notifyAboutForegroundNotificationForAppId:(NSString*)appId notification:(NSDictionary*)notification;

- (void)registerModuleAndGetPendingDeliveriesWithAppId:(NSString*)appId mailbox:(id<EXMailbox>)mailbox;

- (void)unregisterModuleWithAppId:(NSString*)appId;

- (void)doWeHaveMailboxRegisteredAsAppId:(NSString*)appId completionHandler:(void (^)(BOOL))completionHandler;

@end

#endif /* EXPostOffice_h */
