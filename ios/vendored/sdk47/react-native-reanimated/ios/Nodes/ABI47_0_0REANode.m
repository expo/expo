#import <ABI47_0_0RNReanimated/ABI47_0_0REANode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REANodesManager.h>

#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>

@interface ABI47_0_0REAUpdateContext ()

@property (nonatomic, nonnull) NSMutableArray<ABI47_0_0REANode *> *updatedNodes;
@property (nonatomic) NSNumber *loopID;

@end

@implementation ABI47_0_0REAUpdateContext

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

@interface ABI47_0_0REANode ()

@property (nonatomic) NSMutableDictionary<ABI47_0_0REANodeID, NSNumber *> *lastLoopID;
@property (nonatomic) NSMutableDictionary<ABI47_0_0REANodeID, id> *memoizedValue;
@property (nonatomic, nullable) NSMutableArray<ABI47_0_0REANode *> *childNodes;

@end

@implementation ABI47_0_0REANode

- (instancetype)initWithID:(ABI47_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super init])) {
    _nodeID = nodeID;
    _lastLoopID = [NSMutableDictionary dictionary];
    _memoizedValue = [NSMutableDictionary dictionary];
    _lastLoopID[@""] = 0;
  }
  return self;
}

ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

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

- (void)addChild:(ABI47_0_0REANode *)child
{
  if (!_childNodes) {
    _childNodes = [NSMutableArray new];
  }
  if (child) {
    [_childNodes addObject:child];
    [child dangerouslyRescheduleEvaluate];
  }
}

- (void)removeChild:(ABI47_0_0REANode *)child
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

+ (NSMutableArray<ABI47_0_0REANode *> *)updatedNodes
{
  static NSMutableArray<ABI47_0_0REANode *> *updatedNodes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    updatedNodes = [NSMutableArray new];
  });
  return updatedNodes;
}

+ (void)findAndUpdateNodes:(nonnull ABI47_0_0REANode *)node
            withVisitedSet:(NSMutableSet<ABI47_0_0REANode *> *)visitedNodes
            withFinalNodes:(NSMutableArray<id<ABI47_0_0REAFinalNode>> *)finalNodes
{
  if ([visitedNodes containsObject:node]) {
    return;
  } else {
    [visitedNodes addObject:node];
  }
  for (ABI47_0_0REANode *child in node.childNodes) {
    [self findAndUpdateNodes:child withVisitedSet:visitedNodes withFinalNodes:finalNodes];
  }
  if ([node conformsToProtocol:@protocol(ABI47_0_0REAFinalNode)]) {
    [finalNodes addObject:(id<ABI47_0_0REAFinalNode>)node];
  }
}

+ (void)runPropUpdates:(ABI47_0_0REAUpdateContext *)context
{
  NSMutableSet<ABI47_0_0REANode *> *visitedNodes = [NSMutableSet new];
  NSMutableArray<id<ABI47_0_0REAFinalNode>> *finalNodes = [NSMutableArray new];
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
