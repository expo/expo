/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTDeleteMountItem.h"

#import "ABI31_0_0RCTComponentViewRegistry.h"

@implementation ABI31_0_0RCTDeleteMountItem {
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
  UIView<ABI31_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  if (componentView == nil) {
    return;
  }

  [registry enqueueComponentViewWithName:_componentName tag:_tag componentView:componentView];
}

@end
