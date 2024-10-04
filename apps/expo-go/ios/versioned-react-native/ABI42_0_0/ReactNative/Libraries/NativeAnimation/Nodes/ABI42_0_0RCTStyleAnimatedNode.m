/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTStyleAnimatedNode.h>
#import <ABI42_0_0React/ABI42_0_0RCTAnimationUtils.h>
#import <ABI42_0_0React/ABI42_0_0RCTValueAnimatedNode.h>
#import <ABI42_0_0React/ABI42_0_0RCTTransformAnimatedNode.h>

@implementation ABI42_0_0RCTStyleAnimatedNode
{
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
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
    ABI42_0_0RCTAnimatedNode *node = [self.parentNodes objectForKey:nodeTag];
    if (node) {
      if ([node isKindOfClass:[ABI42_0_0RCTValueAnimatedNode class]]) {
        ABI42_0_0RCTValueAnimatedNode *parentNode = (ABI42_0_0RCTValueAnimatedNode *)node;
        [self->_propsDictionary setObject:@(parentNode.value) forKey:property];
      } else if ([node isKindOfClass:[ABI42_0_0RCTTransformAnimatedNode class]]) {
        ABI42_0_0RCTTransformAnimatedNode *parentNode = (ABI42_0_0RCTTransformAnimatedNode *)node;
        [self->_propsDictionary addEntriesFromDictionary:parentNode.propsDictionary];
      }
    }
  }];
}

@end
