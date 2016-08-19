/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTStyleAnimatedNode.h"
#import "ABI9_0_0RCTAnimationUtils.h"
#import "ABI9_0_0RCTValueAnimatedNode.h"
#import "ABI9_0_0RCTTransformAnimatedNode.h"

@implementation ABI9_0_0RCTStyleAnimatedNode
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

  NSDictionary<NSString *, NSNumber *> *style = self.config[@"style"];
  [style enumerateKeysAndObjectsUsingBlock:^(NSString *property, NSNumber *nodeTag, __unused BOOL *stop) {
    ABI9_0_0RCTAnimatedNode *node = self.parentNodes[nodeTag];
    if (node && node.hasUpdated) {
      if ([node isKindOfClass:[ABI9_0_0RCTValueAnimatedNode class]]) {
        ABI9_0_0RCTValueAnimatedNode *parentNode = (ABI9_0_0RCTValueAnimatedNode *)node;
        [self->_updatedPropsDictionary setObject:@(parentNode.value) forKey:property];
      } else if ([node isKindOfClass:[ABI9_0_0RCTTransformAnimatedNode class]]) {
        ABI9_0_0RCTTransformAnimatedNode *parentNode = (ABI9_0_0RCTTransformAnimatedNode *)node;
        [self->_updatedPropsDictionary addEntriesFromDictionary:parentNode.updatedPropsDictionary];
      }
    }
  }];
}

- (void)cleanupAnimationUpdate
{
  [super cleanupAnimationUpdate];
  [_updatedPropsDictionary removeAllObjects];
}

@end
