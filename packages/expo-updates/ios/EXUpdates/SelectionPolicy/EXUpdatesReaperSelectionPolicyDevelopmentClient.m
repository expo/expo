//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesReaperSelectionPolicyDevelopmentClient.h>

NS_ASSUME_NONNULL_BEGIN

static NSUInteger const EXUpdatesReaperSelectionPolicyDefaultMaxUpdates = 10;

@interface EXUpdatesReaperSelectionPolicyDevelopmentClient ()

@property (nonatomic, assign) NSUInteger maxUpdatesToKeep;

@end

@implementation EXUpdatesReaperSelectionPolicyDevelopmentClient

- (instancetype)init
{
  return [self initWithMaxUpdatesToKeep:EXUpdatesReaperSelectionPolicyDefaultMaxUpdates];
}

- (instancetype)initWithMaxUpdatesToKeep:(NSUInteger)maxUpdatesToKeep
{
  if (self = [super init]) {
    _maxUpdatesToKeep = maxUpdatesToKeep;
  }
  return self;
}

- (NSArray<EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(EXUpdatesUpdate *)launchedUpdate updates:(NSArray<EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  if (!launchedUpdate || updates.count <= _maxUpdatesToKeep) {
    return @[];
  }

  NSMutableArray<EXUpdatesUpdate *> *updatesMutable = [updates sortedArrayUsingComparator:^NSComparisonResult(id obj1, id obj2) {
    EXUpdatesUpdate *update1 = (EXUpdatesUpdate *)obj1;
    EXUpdatesUpdate *update2 = (EXUpdatesUpdate *)obj2;
    NSComparisonResult result = [update1.lastAccessed compare:update2.lastAccessed];
    if (result == NSOrderedSame) {
      result = [update1.commitTime compare:update2.commitTime];
    }
    return result;
  }].mutableCopy;

  NSMutableArray<EXUpdatesUpdate *> *updatesToDelete = [NSMutableArray new];
  while (updatesMutable.count > _maxUpdatesToKeep) {
    EXUpdatesUpdate *oldest = updatesMutable[0];
    [updatesMutable removeObjectAtIndex:0];
    if ([launchedUpdate.updateId isEqual:oldest.updateId]) {
      // we don't want to delete launchedUpdate, so put it back on the end of the stack
      [updatesMutable addObject:oldest];
    } else {
      [updatesToDelete addObject:oldest];
    }
  }

  return updatesToDelete;
}

@end

NS_ASSUME_NONNULL_END
