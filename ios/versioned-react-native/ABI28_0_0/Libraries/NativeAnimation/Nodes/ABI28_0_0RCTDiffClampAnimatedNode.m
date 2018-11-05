/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTDiffClampAnimatedNode.h"

#import <ReactABI28_0_0/ABI28_0_0RCTLog.h>

@implementation ABI28_0_0RCTDiffClampAnimatedNode
{
  NSNumber *_inputNodeTag;
  CGFloat _min;
  CGFloat _max;
  CGFloat _lastValue;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithTag:tag config:config]) {
    _inputNodeTag = config[@"input"];
    _min = [config[@"min"] floatValue];
    _max = [config[@"max"] floatValue];
  }

  return self;
}

- (void)onAttachedToNode:(ABI28_0_0RCTAnimatedNode *)parent
{
  [super onAttachedToNode:parent];

  self.value = _lastValue = [self inputNodeValue];
}

- (void)performUpdate
{
  [super performUpdate];

  CGFloat value = [self inputNodeValue];

  CGFloat diff = value - _lastValue;
  _lastValue = value;
  self.value = MIN(MAX(self.value + diff, _min), _max);
}

- (CGFloat)inputNodeValue
{
  ABI28_0_0RCTValueAnimatedNode *inputNode = (ABI28_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:_inputNodeTag];
  if (![inputNode isKindOfClass:[ABI28_0_0RCTValueAnimatedNode class]]) {
    ABI28_0_0RCTLogError(@"Illegal node ID set as an input for Animated.DiffClamp node");
    return 0;
  }

  return inputNode.value;
}

@end
