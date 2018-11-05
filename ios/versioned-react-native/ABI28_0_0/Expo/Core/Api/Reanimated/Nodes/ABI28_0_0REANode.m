#import "ABI28_0_0REANode.h"
#import "ABI28_0_0REANodesManager.h"

#import <ReactABI28_0_0/ABI28_0_0RCTDefines.h>

@interface ABI28_0_0REAUpdateContext ()

@property (nonatomic, nonnull) NSMutableArray<ABI28_0_0REANode *> *updatedNodes;
@property (nonatomic) NSUInteger loopID;

@end

@implementation ABI28_0_0REAUpdateContext

- (instancetype)init
{
  if ((self = [super init])) {
    _loopID = 1;
    _updatedNodes = [NSMutableArray new];
  }
  return self;
}

@end


@interface ABI28_0_0REANode ()

@property (nonatomic) NSUInteger lastLoopID;
@property (nonatomic) id memoizedValue;
@property (nonatomic, nullable) NSMutableArray<ABI28_0_0REANode *> *childNodes;

@end

@implementation ABI28_0_0REANode

- (instancetype)initWithID:(ABI28_0_0REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
    if ((self = [super init])) {
      _nodeID = nodeID;
      _lastLoopID = 0;
    }
    return self;
}

ABI28_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)dangerouslyRescheduleEvaluate
{
  _lastLoopID = 0;
  [self markUpdated];
}

- (void)forceUpdateMemoizedValue:(id)value
{
  _memoizedValue = value;
  [self markUpdated];
}

- (id)evaluate
{
  return 0;
}

- (id)value
{
  if (_lastLoopID < _updateContext.loopID) {
    _lastLoopID = _updateContext.loopID;
    return (_memoizedValue = [self evaluate]);
  }
  return _memoizedValue;
}

- (void)addChild:(ABI28_0_0REANode *)child
{
  if (!_childNodes) {
    _childNodes = [NSMutableArray new];
  }
  if (child) {
    [_childNodes addObject:child];
    [self dangerouslyRescheduleEvaluate];
  }
}

- (void)removeChild:(ABI28_0_0REANode *)child
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

+ (NSMutableArray<ABI28_0_0REANode *> *)updatedNodes
{
  static NSMutableArray<ABI28_0_0REANode *> *updatedNodes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    updatedNodes = [NSMutableArray new];
  });
  return updatedNodes;
}

+ (void)findAndUpdateNodes:(nonnull ABI28_0_0REANode *)node
            withVisitedSet:(NSMutableSet<ABI28_0_0REANode *> *)visitedNodes
{
  if ([visitedNodes containsObject:node]) {
    return;
  } else {
    [visitedNodes addObject:node];
  }
  if ([node respondsToSelector:@selector(update)]) {
    [(id)node update];
  } else {
    for (ABI28_0_0REANode *child in node.childNodes) {
      [self findAndUpdateNodes:child withVisitedSet:visitedNodes];
    }
  }
}

+ (void)runPropUpdates:(ABI28_0_0REAUpdateContext *)context
{
  NSMutableSet<ABI28_0_0REANode *> *visitedNodes = [NSMutableSet new];
  for (NSUInteger i = 0; i < context.updatedNodes.count; i++) {
    [self findAndUpdateNodes:context.updatedNodes[i] withVisitedSet:visitedNodes];
  }
  [context.updatedNodes removeAllObjects];
  context.loopID++;
}

@end
