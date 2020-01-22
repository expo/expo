/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTDeleteMountItem.h"

#import "ABI35_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI35_0_0;

@implementation ABI35_0_0RCTDeleteMountItem {
  ComponentHandle _componentHandle;
  ReactABI35_0_0Tag _tag;
}

- (instancetype)initWithComponentHandle:(facebook::ReactABI35_0_0::ComponentHandle)componentHandle
                                    tag:(ReactABI35_0_0Tag)tag
{
  if (self = [super init]) {
    _componentHandle = componentHandle;
    _tag = tag;
  }

  return self;
}

- (void)executeWithRegistry:(ABI35_0_0RCTComponentViewRegistry *)registry
{
  UIView<ABI35_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  if (componentView == nil) {
    return;
  }

  [registry enqueueComponentViewWithComponentHandle:_componentHandle tag:_tag componentView:componentView];
}

@end
