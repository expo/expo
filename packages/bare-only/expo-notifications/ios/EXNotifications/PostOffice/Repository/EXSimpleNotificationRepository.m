//  Copyright © 2019-present 650 Industries. All rights reserved.

#import "EXSimpleNotificationRepository.h"

@interface EXSimpleNotificationRepository()

@property (nonatomic) NSUserDefaults *userIntercations;

@end

@implementation EXSimpleNotificationRepository

- (instancetype)init
{
  if (self = [super init]) {
    NSString *className = NSStringFromClass([self class]);
    NSString *userInteractionSuiteName = [NSString stringWithFormat:@"%@/%@", @"UI_", className];
    self.userIntercations = [[NSUserDefaults alloc] initWithSuiteName:userInteractionSuiteName];
  }
  return self;
}

- (void)addUserInteractionForAppId:(NSString *)appId userInteraction:(NSDictionary*)userInteraction
{
  [self.userIntercations setObject:userInteraction forKey:appId];
}

- (NSDictionary*)getUserInterationForAppId:(NSString *)appId
{
  NSDictionary *userInteraction = [self.userIntercations dictionaryForKey:appId];
  [_userIntercations removeObjectForKey:appId];
  return userInteraction;
}

@end
