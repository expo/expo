/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTTransformAnimatedNode.h"
#import "ABI8_0_0RCTValueAnimatedNode.h"

@implementation ABI8_0_0RCTTransformAnimatedNode
{
  NSMutableDictionary<NSString *, NSNumber *> *_updatedPropsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config;
{
  if ((self = [super initWithTag:tag config:config])) {
    _updatedPropsDictionary = [NSMutableDictionary new];
  }
  return self;
}

- (NSDictionary *)updatedPropsDictionary
{
  return _updatedPropsDictionary;
}

- (void)performUpdate
{
  [super performUpdate];

  NSDictionary<NSString *, NSNumber *> *transforms = self.config[@"animated"];
  [transforms enumerateKeysAndObjectsUsingBlock:^(NSString *property, NSNumber *nodeTag, __unused BOOL *stop) {
    ABI8_0_0RCTAnimatedNode *node = self.parentNodes[nodeTag];
    if (node.hasUpdated && [node isKindOfClass:[ABI8_0_0RCTValueAnimatedNode class]]) {
      ABI8_0_0RCTValueAnimatedNode *parentNode = (ABI8_0_0RCTValueAnimatedNode *)node;
      self->_updatedPropsDictionary[property] = @(parentNode.value);
    }
  }];
}

- (void)cleanupAnimationUpdate
{
  [super cleanupAnimationUpdate];
  [_updatedPropsDictionary removeAllObjects];
}

@end
