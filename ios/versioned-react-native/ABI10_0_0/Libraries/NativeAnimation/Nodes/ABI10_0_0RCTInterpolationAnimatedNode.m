/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTInterpolationAnimatedNode.h"
#import "ABI10_0_0RCTAnimationUtils.h"

@implementation ABI10_0_0RCTInterpolationAnimatedNode
{
  __weak ABI10_0_0RCTValueAnimatedNode *_parentNode;
  NSArray<NSNumber *> *_inputRange;
  NSArray<NSNumber *> *_outputRange;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config])) {
    _inputRange = [config[@"inputRange"] copy];
    NSMutableArray *outputRange = [NSMutableArray array];
    for (id value in config[@"outputRange"]) {
      if ([value isKindOfClass:[NSNumber class]]) {
        [outputRange addObject:value];
      }
    }
    _outputRange = [outputRange copy];
  }
  return self;
}

- (void)onAttachedToNode:(ABI10_0_0RCTAnimatedNode *)parent
{
  [super onAttachedToNode:parent];
  if ([parent isKindOfClass:[ABI10_0_0RCTValueAnimatedNode class]]) {
    _parentNode = (ABI10_0_0RCTValueAnimatedNode *)parent;
  }
}

- (void)onDetachedFromNode:(ABI10_0_0RCTAnimatedNode *)parent
{
  [super onDetachedFromNode:parent];
  if (_parentNode == parent) {
    _parentNode = nil;
  }
}

- (NSUInteger)findIndexOfNearestValue:(CGFloat)value
                              inRange:(NSArray<NSNumber *> *)range
{
  NSUInteger index;
  NSUInteger rangeCount = range.count;
  for (index = 1; index < rangeCount - 1; index++) {
    NSNumber *inputValue = range[index];
    if (inputValue.doubleValue >= value) {
      break;
    }
  }
  return index - 1;
}

- (void)performUpdate
{
  [super performUpdate];
  if (!_parentNode) {
    return;
  }

  NSUInteger rangeIndex = [self findIndexOfNearestValue:_parentNode.value
                                                inRange:_inputRange];
  NSNumber *inputMin = _inputRange[rangeIndex];
  NSNumber *inputMax = _inputRange[rangeIndex + 1];
  NSNumber *outputMin = _outputRange[rangeIndex];
  NSNumber *outputMax = _outputRange[rangeIndex + 1];

  CGFloat outputValue = ABI10_0_0RCTInterpolateValue(_parentNode.value,
                                            inputMin.doubleValue,
                                            inputMax.doubleValue,
                                            outputMin.doubleValue,
                                            outputMax.doubleValue);
  self.value = outputValue;
}

@end
