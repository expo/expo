//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesLauncherSelectionPolicySingleUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesLauncherSelectionPolicySingleUpdate ()

@property (nonatomic, strong) NSUUID *updateId;

@end

@implementation ABI42_0_0EXUpdatesLauncherSelectionPolicySingleUpdate

- (instancetype)initWithUpdateID:(NSUUID *)updateId
{
  if (self = [super init]) {
    _updateId = updateId;
  }
  return self;
}

- (nullable ABI42_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI42_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  for (ABI42_0_0EXUpdatesUpdate *update in updates) {
    if ([update.updateId isEqual:_updateId]) {
      return update;
    }
  }
  return nil;
}

@end

NS_ASSUME_NONNULL_END
