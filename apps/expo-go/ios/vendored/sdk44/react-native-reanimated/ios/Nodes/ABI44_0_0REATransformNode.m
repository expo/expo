#import "ABI44_0_0REATransformNode.h"
#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import "ABI44_0_0REANodesManager.h"

@implementation ABI44_0_0REATransformNode {
  NSArray<id> *_transformConfigs;
}

- (instancetype)initWithID:(ABI44_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
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
    ABI44_0_0REANodeID nodeID = [ABI44_0_0RCTConvert NSNumber:transformConfig[@"nodeID"]];
    NSNumber *value;
    if (nodeID) {
      ABI44_0_0REANode *node = [self.nodesManager findNodeByID:nodeID];
      value = [node value];
    } else {
      value = transformConfig[@"value"];
    }
    [transform addObject:@{property : value}];
  }

  return transform;
}

@end
