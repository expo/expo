/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTAnimationUtils.h>
#import <ABI49_0_0React/ABI49_0_0RCTColorAnimatedNode.h>
#import <ABI49_0_0React/ABI49_0_0RCTStyleAnimatedNode.h>
#import <ABI49_0_0React/ABI49_0_0RCTTransformAnimatedNode.h>
#import <ABI49_0_0React/ABI49_0_0RCTValueAnimatedNode.h>

@implementation ABI49_0_0RCTStyleAnimatedNode {
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
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
    ABI49_0_0RCTAnimatedNode *node = [self.parentNodes objectForKey:nodeTag];
    if (node) {
      if ([node isKindOfClass:[ABI49_0_0RCTValueAnimatedNode class]]) {
        ABI49_0_0RCTValueAnimatedNode *valueAnimatedNode = (ABI49_0_0RCTValueAnimatedNode *)node;
        id animatedObject = valueAnimatedNode.animatedObject;
        if (animatedObject) {
          _propsDictionary[property] = animatedObject;
        } else {
          _propsDictionary[property] = @(valueAnimatedNode.value);
        }
      } else if ([node isKindOfClass:[ABI49_0_0RCTTransformAnimatedNode class]]) {
        ABI49_0_0RCTTransformAnimatedNode *transformAnimatedNode = (ABI49_0_0RCTTransformAnimatedNode *)node;
        [_propsDictionary addEntriesFromDictionary:transformAnimatedNode.propsDictionary];
      } else if ([node isKindOfClass:[ABI49_0_0RCTColorAnimatedNode class]]) {
        ABI49_0_0RCTColorAnimatedNode *colorAnimatedNode = (ABI49_0_0RCTColorAnimatedNode *)node;
        _propsDictionary[property] = @(colorAnimatedNode.color);
      }
    }
  }];
}

@end
