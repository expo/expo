/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTStyleAnimatedNode.h"
#import "ABI16_0_0RCTAnimationUtils.h"
#import "ABI16_0_0RCTValueAnimatedNode.h"
#import "ABI16_0_0RCTTransformAnimatedNode.h"

@implementation ABI16_0_0RCTStyleAnimatedNode
{
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config;
{
  if ((self = [super initWithTag:tag config:config])) {
    _propsDictionary = [NSMutableDictionary new];
  }
  return self;
}

- (NSDictionary *)propsDictionary
{
  return _propsDictionary;
}

- (void)performUpdate
{
  [super performUpdate];

  NSDictionary<NSString *, NSNumber *> *style = self.config[@"style"];
  [style enumerateKeysAndObjectsUsingBlock:^(NSString *property, NSNumber *nodeTag, __unused BOOL *stop) {
    ABI16_0_0RCTAnimatedNode *node = self.parentNodes[nodeTag];
    if (node) {
      if ([node isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
        ABI16_0_0RCTValueAnimatedNode *parentNode = (ABI16_0_0RCTValueAnimatedNode *)node;
        [self->_propsDictionary setObject:@(parentNode.value) forKey:property];
      } else if ([node isKindOfClass:[ABI16_0_0RCTTransformAnimatedNode class]]) {
        ABI16_0_0RCTTransformAnimatedNode *parentNode = (ABI16_0_0RCTTransformAnimatedNode *)node;
        [self->_propsDictionary addEntriesFromDictionary:parentNode.propsDictionary];
      }
    }
  }];
}

@end
