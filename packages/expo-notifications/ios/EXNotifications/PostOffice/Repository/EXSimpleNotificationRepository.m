//  Copyright © 2019-present 650 Industries. All rights reserved.

#import "EXSimpleNotificationRepository.h"

@interface EXSimpleNotificationRepository()

@property (nonatomic) NSMutableDictionary<NSString*,NSMutableArray<NSDictionary*>*> *pendingUserInteractions;

@end

@implementation EXSimpleNotificationRepository

- (instancetype)init
{
  if (self = [super init]) {
    _pendingUserInteractions = [NSMutableDictionary new];
  }
  return self;
}

- (void)addUserInteractionForAppId:(NSString *)appId userInteraction:(NSDictionary*)userInteraction
{
  if(!_pendingUserInteractions[appId]) {
    _pendingUserInteractions[appId] = [@[] mutableCopy];
  }
  [_pendingUserInteractions[appId] addObject:userInteraction];
}

- (NSArray<NSDictionary*>*)getPendingUserInterationsForAppId:(NSString *)appId
{
  NSArray<NSDictionary*> *pendingUserInteractions = _pendingUserInteractions[appId];
  _pendingUserInteractions[appId] = nil;
  return pendingUserInteractions;
}

@end
