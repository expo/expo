#import <ABI47_0_0RNReanimated/ABI47_0_0REAValueNode.h>

@implementation ABI47_0_0REAValueNode {
  NSNumber *_value;
}

- (instancetype)initWithID:(ABI47_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithID:nodeID config:config]) {
    _value = config[@"value"];
  }
  return self;
}

- (void)setValue:(NSNumber *)value
{
  _value = value;
  [self forceUpdateMemoizedValue:value];
}

- (id)evaluate
{
  return _value;
}

@end
