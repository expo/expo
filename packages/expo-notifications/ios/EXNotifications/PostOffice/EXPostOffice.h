//  Copyright © 2019-present 650 Industries. All rights reserved.

#ifndef EXPostOffice_h
#define EXPostOffice_h

#import "EXMailbox.h"

@protocol EXPostOffice <NSObject>

- (void)notifyAboutUserInteractionForAppId:(NSString*)appId userInteraction:(NSDictionary*)userInteraction;

- (void)registerModuleAndGetInitialNotificationWithAppId:(NSString *)appId
                                               mailbox:(id<EXMailbox>)mailbox
                                     completionHandler:(void (^)(NSDictionary*))completionHandler;

- (void)unregisterModuleWithAppId:(NSString*)appId;

- (void)tryToSendForegroundNotificationTo:(NSString*)appId foregroundNotification:(NSDictionary*)foregroundNotification completionHandler:(void (^)(BOOL))completionHandler;

@end

#endif /* EXPostOffice_h */
