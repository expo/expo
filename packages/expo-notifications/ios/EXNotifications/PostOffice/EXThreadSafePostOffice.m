//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationRepository.h>
#import <EXNotifications/EXSimpleNotificationRepository.h>
#import <EXNotifications/EXSimplePostOffice.h>
#import <EXNotifications/EXThreadSafePostOffice.h>

@interface EXThreadSafePostOffice ()

@property(atomic) id<EXPostOffice> insecurePostOffice;

@end

@implementation EXThreadSafePostOffice

static dispatch_queue_t queue;

- (instancetype)init {
  if (self = [super init]) {
    id<EXNotificationRepository> notificationRepostory = [EXSimpleNotificationRepository new];
    self.insecurePostOffice =
        [[EXSimplePostOffice alloc] initWithNotificationRepository:notificationRepostory];
  }
  return self;
}

+ (id<EXPostOffice>)sharedInstance {
  static EXThreadSafePostOffice *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[EXThreadSafePostOffice alloc] init];
    queue =
        dispatch_queue_create("host.exp.exponent.EXThreadSafePostOffice", DISPATCH_QUEUE_SERIAL);
  });
  return sharedInstance;
}

- (void)notifyAboutUserInteractionForAppId:(NSString *)appId
                           userInteraction:(NSDictionary *)userInteraction {
  dispatch_async(queue, ^{
    [self.insecurePostOffice notifyAboutUserInteractionForAppId:appId
                                                userInteraction:userInteraction];
  });
}

- (void)registerModuleAndFlushPendingUserIntercationsWithAppId:(NSString *)appId
                                                       mailbox:(id<EXMailbox>)mailbox {
  dispatch_async(queue, ^{
    [self.insecurePostOffice registerModuleAndFlushPendingUserIntercationsWithAppId:appId
                                                                            mailbox:mailbox];
  });
}

- (void)unregisterModuleWithAppId:(NSString *)appId {
  dispatch_async(queue, ^{
    [self.insecurePostOffice unregisterModuleWithAppId:appId];
  });
}

- (void)tryToSendForegroundNotificationTo:(NSString *)appId
                   foregroundNotification:(NSDictionary *)foregroundNotification
                        completionHandler:(void (^)(BOOL))completionHandler {
  dispatch_async(queue, ^{
    [self.insecurePostOffice tryToSendForegroundNotificationTo:appId
                                        foregroundNotification:foregroundNotification
                                             completionHandler:completionHandler];
  });
}

@end
