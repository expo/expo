/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTDeleteMountItem.h"

#import "ABI33_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI33_0_0;

@implementation ABI33_0_0RCTDeleteMountItem {
  ComponentHandle _componentHandle;
  ReactABI33_0_0Tag _tag;
}

- (instancetype)initWithComponentHandle:(facebook::ReactABI33_0_0::ComponentHandle)componentHandle
                                    tag:(ReactABI33_0_0Tag)tag
{
  if (self = [super init]) {
    _componentHandle = componentHandle;
    _tag = tag;
  }

  return self;
}

- (void)executeWithRegistry:(ABI33_0_0RCTComponentViewRegistry *)registry
{
  UIView<ABI33_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  if (componentView == nil) {
    return;
  }

  [registry enqueueComponentViewWithComponentHandle:_componentHandle tag:_tag componentView:componentView];
}

@end
