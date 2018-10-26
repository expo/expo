/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTUpdatePropsMountItem.h"

#import "ABI31_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI31_0_0;

@implementation ABI31_0_0RCTUpdatePropsMountItem {
  ReactABI31_0_0Tag _tag;
  SharedProps _oldProps;
  SharedProps _newProps;
}

- (instancetype)initWithTag:(ReactABI31_0_0Tag)tag
                   oldProps:(SharedProps)oldProps
                   newProps:(SharedProps)newProps
{
  if (self = [super init]) {
    _tag = tag;
    _oldProps = oldProps;
    _newProps = newProps;
  }

  return self;
}

- (void)executeWithRegistry:(ABI31_0_0RCTComponentViewRegistry *)registry
{
  UIView<ABI31_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];
  [componentView updateProps:_newProps oldProps:_oldProps];
}

@end
