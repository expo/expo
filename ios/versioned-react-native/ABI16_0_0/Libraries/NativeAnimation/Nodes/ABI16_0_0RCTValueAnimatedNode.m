/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTValueAnimatedNode.h"

@interface ABI16_0_0RCTValueAnimatedNode ()

@property (nonatomic, assign) CGFloat offset;

@end

@implementation ABI16_0_0RCTValueAnimatedNode

@synthesize value = _value;

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithTag:tag config:config]) {
    _offset = [self.config[@"offset"] floatValue];
    _value = [self.config[@"value"] floatValue];
  }
  return self;
}

- (void)flattenOffset
{
  _value += _offset;
  _offset = 0;
}

- (void)extractOffset
{
  _offset += _value;
  _value = 0;
}

- (CGFloat)value
{
  return _value + _offset;
}

- (void)setValue:(CGFloat)value
{
  _value = value;

  if (_valueObserver) {
    [_valueObserver animatedNode:self didUpdateValue:_value];
  }
}

@end
