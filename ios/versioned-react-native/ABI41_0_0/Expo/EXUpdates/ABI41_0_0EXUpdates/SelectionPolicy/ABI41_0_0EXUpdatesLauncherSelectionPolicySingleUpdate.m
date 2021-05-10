//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesLauncherSelectionPolicySingleUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesLauncherSelectionPolicySingleUpdate ()

@property (nonatomic, strong) NSUUID *updateId;

@end

@implementation ABI41_0_0EXUpdatesLauncherSelectionPolicySingleUpdate

- (instancetype)initWithUpdateID:(NSUUID *)updateId
{
  if (self = [super init]) {
    _updateId = updateId;
  }
  return self;
}

- (nullable ABI41_0_0EXUpdatesUpdate *)launchableUpdateFromUpdates:(NSArray<ABI41_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  for (ABI41_0_0EXUpdatesUpdate *update in updates) {
    if ([update.updateId isEqual:_updateId]) {
      return update;
    }
  }
  return nil;
}

@end

NS_ASSUME_NONNULL_END
