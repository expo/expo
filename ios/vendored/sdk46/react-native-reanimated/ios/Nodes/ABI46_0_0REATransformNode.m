#import <ABI46_0_0RNReanimated/ABI46_0_0REANodesManager.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REATransformNode.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>

@implementation ABI46_0_0REATransformNode {
  NSArray<id> *_transformConfigs;
}

- (instancetype)initWithID:(ABI46_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithID:nodeID config:config])) {
    _transformConfigs = config[@"transform"];
  }
  return self;
}

- (id)evaluate
{
  NSMutableArray<NSDictionary *> *transform = [NSMutableArray arrayWithCapacity:_transformConfigs.count];
  for (NSDictionary *transformConfig in _transformConfigs) {
    NSString *property = transformConfig[@"property"];
    ABI46_0_0REANodeID nodeID = [ABI46_0_0RCTConvert NSNumber:transformConfig[@"nodeID"]];
    NSNumber *value;
    if (nodeID) {
      ABI46_0_0REANode *node = [self.nodesManager findNodeByID:nodeID];
      value = [node value];
    } else {
      value = transformConfig[@"value"];
    }
    [transform addObject:@{property : value}];
  }

  return transform;
}

@end
