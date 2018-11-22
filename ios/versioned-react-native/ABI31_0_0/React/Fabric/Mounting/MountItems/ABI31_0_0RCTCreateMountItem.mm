/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTCreateMountItem.h"

#import "ABI31_0_0RCTComponentViewRegistry.h"

@implementation ABI31_0_0RCTCreateMountItem {
  NSString *_componentName;
  ReactABI31_0_0Tag _tag;
}

- (instancetype)initWithComponentName:(NSString *)componentName
                                  tag:(ReactABI31_0_0Tag)tag
{
  if (self = [super init]) {
    _componentName = componentName;
    _tag = tag;
  }

  return self;
}

- (void)executeWithRegistry:(ABI31_0_0RCTComponentViewRegistry *)registry
{
  [registry dequeueComponentViewWithName:_componentName tag:_tag];
}

@end
