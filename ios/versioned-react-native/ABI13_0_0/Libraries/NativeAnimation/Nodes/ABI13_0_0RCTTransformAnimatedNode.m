/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTTransformAnimatedNode.h"
#import "ABI13_0_0RCTValueAnimatedNode.h"

@implementation ABI13_0_0RCTTransformAnimatedNode
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

  CATransform3D transform = CATransform3DIdentity;

  NSArray<NSDictionary *> *transformConfigs = self.config[@"transforms"];
  for (NSDictionary *transformConfig in transformConfigs) {
    NSString *type = transformConfig[@"type"];
    NSString *property = transformConfig[@"property"];

    CGFloat value;
    if ([type isEqualToString: @"animated"]) {
      NSNumber *nodeTag = transformConfig[@"nodeTag"];
      ABI13_0_0RCTAnimatedNode *node = self.parentNodes[nodeTag];
      if (![node isKindOfClass:[ABI13_0_0RCTValueAnimatedNode class]]) {
        continue;
      }
      ABI13_0_0RCTValueAnimatedNode *parentNode = (ABI13_0_0RCTValueAnimatedNode *)node;
      value = parentNode.value;
    } else {
      value = [transformConfig[@"value"] floatValue];
    }

    if ([property isEqualToString:@"scale"]) {
      transform = CATransform3DScale(transform, value, value, 1);

    } else if ([property isEqualToString:@"scaleX"]) {
      transform = CATransform3DScale(transform, value, 1, 1);

    } else if ([property isEqualToString:@"scaleY"]) {
      transform = CATransform3DScale(transform, 1, value, 1);

    } else if ([property isEqualToString:@"translateX"]) {
      transform = CATransform3DTranslate(transform, value, 0, 0);

    } else if ([property isEqualToString:@"translateY"]) {
      transform = CATransform3DTranslate(transform, 0, value, 0);

    } else if ([property isEqualToString:@"rotate"]) {
      transform = CATransform3DRotate(transform, value, 0, 0, 1);

    } else if ([property isEqualToString:@"rotateX"]) {
      transform = CATransform3DRotate(transform, value, 1, 0, 0);

    } else if ([property isEqualToString:@"rotateY"]) {
      transform = CATransform3DRotate(transform, value, 0, 1, 0);

    } else if ([property isEqualToString:@"perspective"]) {
      transform.m34 = 1.0 / -value;
    }
  }

  _propsDictionary[@"transform"] = [NSValue valueWithCATransform3D:transform];
}

@end
