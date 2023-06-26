/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTRootComponentView.h"

#import <ABI49_0_0React/ABI49_0_0renderer/components/root/RootComponentDescriptor.h>
#import <ABI49_0_0React/ABI49_0_0renderer/components/root/RootProps.h>
#import "ABI49_0_0RCTConversions.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

@implementation ABI49_0_0RCTRootComponentView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RootProps>();
    _props = defaultProps;
  }

  return self;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RootComponentDescriptor>();
}

@end
