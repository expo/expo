/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTTransformAnimatedNode.h>
#import <ABI42_0_0React/ABI42_0_0RCTValueAnimatedNode.h>

@implementation ABI42_0_0RCTTransformAnimatedNode
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

  NSArray<NSDictionary *> *transformConfigs = self.config[@"transforms"];
  NSMutableArray<NSDictionary *> *transform = [NSMutableArray arrayWithCapacity:transformConfigs.count];
  for (NSDictionary *transformConfig in transformConfigs) {
    NSString *type = transformConfig[@"type"];
    NSString *property = transformConfig[@"property"];
    NSNumber *value;
    if ([type isEqualToString: @"animated"]) {
      NSNumber *nodeTag = transformConfig[@"nodeTag"];
      ABI42_0_0RCTAnimatedNode *node = [self.parentNodes objectForKey:nodeTag];
      if (![node isKindOfClass:[ABI42_0_0RCTValueAnimatedNode class]]) {
        continue;
      }
      ABI42_0_0RCTValueAnimatedNode *parentNode = (ABI42_0_0RCTValueAnimatedNode *)node;
      value = @(parentNode.value);
    } else {
      value = transformConfig[@"value"];
    }
    [transform addObject:@{property: value}];
  }

  _propsDictionary[@"transform"] = transform;
}

@end
