#import "DevMenuREANode.h"
#import "DevMenuREANodesManager.h"

#import <React/RCTDefines.h>

@interface DevMenuREAUpdateContext ()

@property (nonatomic, nonnull) NSMutableArray<DevMenuREANode *> *updatedNodes;
@property (nonatomic) NSNumber *loopID;

@end

@implementation DevMenuREAUpdateContext

- (instancetype)init
{
  if ((self = [super init])) {
    _loopID = [[NSNumber alloc] initWithInt:1];
    _updatedNodes = [NSMutableArray new];
    _callID = @"";
  }
  return self;
}

@end

@interface DevMenuREANode ()

@property (nonatomic) NSMutableDictionary<DevMenuREANodeID, NSNumber *> *lastLoopID;
@property (nonatomic) NSMutableDictionary<DevMenuREANodeID, id> *memoizedValue;
@property (nonatomic, nullable) NSMutableArray<DevMenuREANode *> *childNodes;

@end

@implementation DevMenuREANode

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super init])) {
    _nodeID = nodeID;
    _lastLoopID = [NSMutableDictionary dictionary];
    _memoizedValue = [NSMutableDictionary dictionary];
    _lastLoopID[@""] = 0;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (void)dangerouslyRescheduleEvaluate
{
  _lastLoopID[self.updateContext.callID] = 0;
  [self markUpdated];
}

- (void)forceUpdateMemoizedValue:(id)value
{
  _memoizedValue[self.updateContext.callID] = value;
  [self markUpdated];
}

- (id)evaluate
{
  return 0;
}

- (id)value
{
  if (![_lastLoopID objectForKey:_updateContext.callID] ||
      [[_lastLoopID objectForKey:_updateContext.callID] longValue] < [_updateContext.loopID longValue]) {
    [_lastLoopID setObject:_updateContext.loopID forKey:_updateContext.callID];
    id val = [self evaluate];
    [_memoizedValue setObject:(val == nil ? [NSNull null] : val) forKey:_updateContext.callID];
    return val;
  }
  id memoizedValue = [_memoizedValue objectForKey:_updateContext.callID];
  return [memoizedValue isKindOfClass:[NSNull class]] ? nil : memoizedValue;
}

- (void)addChild:(DevMenuREANode *)child
{
  if (!_childNodes) {
    _childNodes = [NSMutableArray new];
  }
  if (child) {
    [_childNodes addObject:child];
    [child dangerouslyRescheduleEvaluate];
  }
}

- (void)removeChild:(DevMenuREANode *)child
{
  if (child) {
    [_childNodes removeObject:child];
  }
}

- (void)markUpdated
{
  [_updateContext.updatedNodes addObject:self];
  [self.nodesManager postRunUpdatesAfterAnimation];
}

+ (NSMutableArray<DevMenuREANode *> *)updatedNodes
{
  static NSMutableArray<DevMenuREANode *> *updatedNodes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    updatedNodes = [NSMutableArray new];
  });
  return updatedNodes;
}

+ (void)findAndUpdateNodes:(nonnull DevMenuREANode *)node
            withVisitedSet:(NSMutableSet<DevMenuREANode *> *)visitedNodes
            withFinalNodes:(NSMutableArray<id<DevMenuREAFinalNode>> *)finalNodes
{
  if ([visitedNodes containsObject:node]) {
    return;
  } else {
    [visitedNodes addObject:node];
  }
  for (DevMenuREANode *child in node.childNodes) {
    [self findAndUpdateNodes:child withVisitedSet:visitedNodes withFinalNodes:finalNodes];
  }
  if ([node conformsToProtocol:@protocol(DevMenuREAFinalNode)]) {
    [finalNodes addObject:(id<DevMenuREAFinalNode>)node];
  }
}

+ (void)runPropUpdates:(DevMenuREAUpdateContext *)context
{
  NSMutableSet<DevMenuREANode *> *visitedNodes = [NSMutableSet new];
  NSMutableArray<id<DevMenuREAFinalNode>> *finalNodes = [NSMutableArray new];
  for (NSUInteger i = 0; i < context.updatedNodes.count; i++) {
    [self findAndUpdateNodes:context.updatedNodes[i] withVisitedSet:visitedNodes withFinalNodes:finalNodes];
    if (i == context.updatedNodes.count - 1) {
      while (finalNodes.count > 0) {
        // NSMutableArray used for stack implementation
        [[finalNodes lastObject] update];
        [finalNodes removeLastObject];
      }
    }
  }

  [context.updatedNodes removeAllObjects];
  context.loopID = [[NSNumber alloc] initWithLong:context.loopID.longValue + 1];
}

- (void)onDrop
{
  // noop
}

@end
