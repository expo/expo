//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesLauncherSelectionPolicySingleUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesLauncherSelectionPolicySingleUpdate ()

@property (nonatomic, strong) NSUUID *updateId;

@end

@implementation ABI48_0_0EXUpdatesLauncherSelectionPolicySingleUpdate

- (instancetype)initWithUpdateID:(NSUUID *)updateId
{
  if (self = [super init]) {
    _updateId = updateId;
  }
  return self;
}

- (nullable ABI48_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI48_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  for (ABI48_0_0EXUpdatesUpdate *update in updates) {
    if ([update.updateId isEqual:_updateId]) {
      return update;
    }
  }
  return nil;
}

@end

NS_ASSUME_NONNULL_END
