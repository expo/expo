/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTUpdateLayoutMetricsMountItem.h"

#import "ABI31_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI31_0_0;

@implementation ABI31_0_0RCTUpdateLayoutMetricsMountItem {
  ReactABI31_0_0Tag _tag;
  LayoutMetrics _oldLayoutMetrics;
  LayoutMetrics _newLayoutMetrics;
}

- (instancetype)initWithTag:(ReactABI31_0_0Tag)tag
           oldLayoutMetrics:(facebook::ReactABI31_0_0::LayoutMetrics)oldLayoutMetrics
           newLayoutMetrics:(facebook::ReactABI31_0_0::LayoutMetrics)newLayoutMetrics
{
  if (self = [super init]) {
    _tag = tag;
    _oldLayoutMetrics = oldLayoutMetrics;
    _newLayoutMetrics = newLayoutMetrics;
  }

  return self;
}

- (void)executeWithRegistry:(ABI31_0_0RCTComponentViewRegistry *)registry
{
  UIView<ABI31_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  [componentView updateLayoutMetrics:_newLayoutMetrics
                    oldLayoutMetrics:_oldLayoutMetrics];
}

@end
