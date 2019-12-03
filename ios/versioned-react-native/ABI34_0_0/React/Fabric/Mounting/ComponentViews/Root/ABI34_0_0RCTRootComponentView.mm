/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTRootComponentView.h"

#import <ReactABI34_0_0/components/root/RootShadowNode.h>
#import <ReactABI34_0_0/components/root/RootProps.h>

using namespace facebook::ReactABI34_0_0;

@implementation ABI34_0_0RCTRootComponentView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RootProps>();
    _props = defaultProps;
  }

  return self;
}

+ (ComponentHandle)componentHandle
{
  return RootShadowNode::Handle();
}

@end
