//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient.h>

NS_ASSUME_NONNULL_BEGIN

static NSUInteger const ABI47_0_0EXUpdatesReaperSelectionPolicyDefaultMaxUpdates = 10;

@interface ABI47_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient ()

@property (nonatomic, assign) NSUInteger maxUpdatesToKeep;

@end

@implementation ABI47_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient

- (instancetype)init
{
  return [self initWithMaxUpdatesToKeep:ABI47_0_0EXUpdatesReaperSelectionPolicyDefaultMaxUpdates];
}

- (instancetype)initWithMaxUpdatesToKeep:(NSUInteger)maxUpdatesToKeep
{
  if (self = [super init]) {
    if (maxUpdatesToKeep <= 0) {
      @throw [NSException exceptionWithName:NSInvalidArgumentException
                                     reason:@"Cannot initiailize ABI47_0_0EXUpdatesReaperSelectionPolicy with maxUpdatesToKeep <= 0"
                                   userInfo:nil];
    }
    _maxUpdatesToKeep = maxUpdatesToKeep;
  }
  return self;
}

- (NSArray<ABI47_0_0EXUpdatesUpdate *> *)updatesToDeleteWithLaunchedUpdate:(ABI47_0_0EXUpdatesUpdate *)launchedUpdate updates:(NSArray<ABI47_0_0EXUpdatesUpdate *> *)updates filters:(nullable NSDictionary *)filters
{
  if (!launchedUpdate || updates.count <= _maxUpdatesToKeep) {
    return @[];
  }

  NSMutableArray<ABI47_0_0EXUpdatesUpdate *> *updatesMutable = [updates sortedArrayUsingComparator:^NSComparisonResult(id obj1, id obj2) {
    ABI47_0_0EXUpdatesUpdate *update1 = (ABI47_0_0EXUpdatesUpdate *)obj1;
    ABI47_0_0EXUpdatesUpdate *update2 = (ABI47_0_0EXUpdatesUpdate *)obj2;
    NSComparisonResult result = [update1.lastAccessed compare:update2.lastAccessed];
    if (result == NSOrderedSame) {
      result = [update1.commitTime compare:update2.commitTime];
    }
    return result;
  }].mutableCopy;

  NSMutableArray<ABI47_0_0EXUpdatesUpdate *> *updatesToDelete = [NSMutableArray new];
  BOOL hasFoundLaunchedUpdate = NO;
  while (updatesMutable.count > _maxUpdatesToKeep) {
    ABI47_0_0EXUpdatesUpdate *oldest = updatesMutable[0];
    [updatesMutable removeObjectAtIndex:0];
    if ([launchedUpdate.updateId isEqual:oldest.updateId]) {
      if (hasFoundLaunchedUpdate) {
        // avoid infinite loop
        @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"Multiple updates with the same ID were passed into ABI47_0_0EXUpdatesReaperSelectionPolicyDevelopmentClient" userInfo:nil];
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
