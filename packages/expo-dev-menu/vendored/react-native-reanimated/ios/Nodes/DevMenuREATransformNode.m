#import "DevMenuREANodesManager.h"
#import "DevMenuREATransformNode.h"
#import <React/RCTConvert.h>

@implementation DevMenuREATransformNode {
  NSArray<id> *_transformConfigs;
}

- (instancetype)initWithID:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
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
    DevMenuREANodeID nodeID = [RCTConvert NSNumber:transformConfig[@"nodeID"]];
    NSNumber *value;
    if (nodeID) {
      DevMenuREANode *node = [self.nodesManager findNodeByID:nodeID];
      value = [node value];
    } else {
      value = transformConfig[@"value"];
    }
    [transform addObject:@{property : value}];
  }

  return transform;
}

@end
