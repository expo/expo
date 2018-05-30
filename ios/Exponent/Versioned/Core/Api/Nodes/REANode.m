#import "REANode.h"
#import "REANodesManager.h"

#import <React/RCTDefines.h>

@interface REAUpdateContext ()

@property (nonatomic, nonnull) NSMutableArray<REANode *> *updatedNodes;
@property (nonatomic) NSUInteger loopID;

@end

@implementation REAUpdateContext

- (instancetype)init
{
  if ((self = [super init])) {
    _loopID = 1;
    _updatedNodes = [NSMutableArray new];
  }
  return self;
}

@end


@interface REANode ()

@property (nonatomic) NSUInteger lastLoopID;
@property (nonatomic) id memoizedValue;
@property (nonatomic, nullable) NSMutableArray<REANode *> *childNodes;

@end

@implementation REANode

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *,id> *)config
{
    if ((self = [super init])) {
      _nodeID = nodeID;
      _lastLoopID = 0;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

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

- (void)addChild:(REANode *)child
{
  if (!_childNodes) {
    _childNodes = [NSMutableArray new];
  }
  if (child) {
    [_childNodes addObject:child];
    [self dangerouslyRescheduleEvaluate];
  }
}

- (void)removeChild:(REANode *)child
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

+ (NSMutableArray<REANode *> *)updatedNodes
{
  static NSMutableArray<REANode *> *updatedNodes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    updatedNodes = [NSMutableArray new];
  });
  return updatedNodes;
}

+ (void)findAndUpdateNodes:(nonnull REANode *)node
            withVisitedSet:(NSMutableSet<REANode *> *)visitedNodes
{
  if ([visitedNodes containsObject:node]) {
    return;
  } else {
    [visitedNodes addObject:node];
  }
  if ([node respondsToSelector:@selector(update)]) {
    [(id)node update];
  } else {
    for (REANode *child in node.childNodes) {
      [self findAndUpdateNodes:child withVisitedSet:visitedNodes];
    }
  }
}

+ (void)runPropUpdates:(REAUpdateContext *)context
{
  NSMutableSet<REANode *> *visitedNodes = [NSMutableSet new];
  for (NSUInteger i = 0; i < context.updatedNodes.count; i++) {
    [self findAndUpdateNodes:context.updatedNodes[i] withVisitedSet:visitedNodes];
  }
  [context.updatedNodes removeAllObjects];
  context.loopID++;
}

@end
