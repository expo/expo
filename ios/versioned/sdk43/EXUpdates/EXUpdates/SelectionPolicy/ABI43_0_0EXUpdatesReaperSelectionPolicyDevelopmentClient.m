//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient.h>

NS_ASSUME_NONNULL_BEGIN

static NSUInteger const ABI43_0_0EXUpdatesReaperSelectionPolicyDefaultMaxUpdates = 10;

@interface ABI43_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient ()

@property (nonatomic, assign) NSUInteger maxUpdatesToKeep;

@end

@implementation ABI43_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient

- (instancetype)init
{
  return [self initWithMaxUpdatesToKeep:ABI43_0_0EXUpdatesReaperSelectionPolicyDefaultMaxUpdates];
}

- (instancetype)initWithMaxUpdatesToKeep:(NSUInteger)maxUpdatesToKeep
{
  if (self = [super init]) {
    if (maxUpdatesToKeep <= 0) {
      @throw [NSException exceptionWithName:NSInvalidArgumentException
                                     reason:@"Cannot initiailize ABI43_0_0EXUpdatesReaperSelectionPolicy with maxUpdatesToKeep <= 0"
                                   userInfo:nil];
    }
    _maxUpdatesToKeep = maxUpdatesToKeep;
  }
  return self;
}

- (NSArray<ABI43_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI43_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI43_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  if (!launchedUpdate || updates.count <= _maxUpdatesToKeep) {
    return @[];
  }

  NSMutableArray<ABI43_0_0EXUpdatesUpdate *> *updatesMutable = [updates sortedArrayUsingComparator:^NSComparisonResult(id obj1, id obj2) {
    ABI43_0_0EXUpdatesUpdate *update1 = (ABI43_0_0EXUpdatesUpdate *)obj1;
    ABI43_0_0EXUpdatesUpdate *update2 = (ABI43_0_0EXUpdatesUpdate *)obj2;
    NSComparisonResult result = [update1.lastAccessed compare:update2.lastAccessed];
    if (result == NSOrderedSame) {
      result = [update1.commitTime compare:update2.commitTime];
    }
    return result;
  }].mutableCopy;

  NSMutableArray<ABI43_0_0EXUpdatesUpdate *> *updatesToDelete = [NSMutableArray new];
  BOOL hasFoundLaunchedUpdate = NO;
  while (updatesMutable.count > _maxUpdatesToKeep) {
    ABI43_0_0EXUpdatesUpdate *oldest = updatesMutable[0];
    [updatesMutable removeObjectAtIndex:0];
    if ([launchedUpdate.updateId isEqual:oldest.updateId]) {
      if (hasFoundLaunchedUpdate) {
        // avoid infinite loop
        @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Multiple updates with the same ID were passed into ABI43_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient" userInfo:nil];
      }
      // we don't want to delete launchedUpdate, so put it back on the end of the stack
      [updatesMutable addObject:oldest];
      hasFoundLaunchedUpdate = YES;
    } else {
      [updatesToDelete addObject:oldest];
    }
  }

  return updatesToDelete;
}

@end

NS_ASSUME_NONNULL_END
