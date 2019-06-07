//  Copyright © 2019-present 650 Industries. All rights reserved.

#import "EXThreadSafePostOffice.h"
#import "EXSimplePostOffice.h"
#import "EXNotificationRepository.h"
#import "EXSimpleNotificationRepository.h"

@interface EXThreadSafePostOffice()

@property (atomic) id<EXPostOffice> insecurePostOffice;

@end

@implementation EXThreadSafePostOffice

static dispatch_queue_t queue;

- (instancetype)init
{
  if (self = [super init]) {
    id<EXNotificationRepository> notificationRepostory = [EXSimpleNotificationRepository new];
    self.insecurePostOffice = [[EXSimplePostOffice alloc] initWithNotificationRepository:notificationRepostory];
  }
  return self;
}

+ (id<EXPostOffice>)sharedInstance
{
  static EXThreadSafePostOffice *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[EXThreadSafePostOffice alloc] init];
    queue = dispatch_queue_create("host.exp.exponent.EXUserNotificationCenter", DISPATCH_QUEUE_SERIAL);
  });
  return sharedInstance;
}

- (void)notifyAboutForegroundNotificationForExperienceId:(NSString *)experienceId notification:(NSDictionary *)notification {
  dispatch_async(queue, ^{
    [self.insecurePostOffice notifyAboutForegroundNotificationForExperienceId:experienceId notification:notification];
  });
}

- (void)notifyAboutUserInteractionForExperienceId:(NSString *)experienceId userInteraction:(NSDictionary *)userInteraction { 
  dispatch_async(queue, ^{
    [self.insecurePostOffice notifyAboutUserInteractionForExperienceId:experienceId userInteraction:userInteraction];
  });
}

- (void)registerModuleAndGetPendingDeliveriesWithExperienceId:(NSString *)experienceId mailbox:(id<EXMailbox>)mailbox { 
  dispatch_async(queue, ^{
    [self.insecurePostOffice registerModuleAndGetPendingDeliveriesWithExperienceId:experienceId mailbox:mailbox];
  });
}

- (void)unregisterModuleWithExperienceId:(NSString *)experienceId { 
  dispatch_async(queue, ^{
    [self.insecurePostOffice unregisterModuleWithExperienceId:experienceId];
  });
}

@end
