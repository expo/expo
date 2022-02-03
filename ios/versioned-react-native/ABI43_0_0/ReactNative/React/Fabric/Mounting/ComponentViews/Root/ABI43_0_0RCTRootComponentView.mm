/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTRootComponentView.h"

#import <ABI43_0_0React/ABI43_0_0renderer/components/root/RootComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/root/RootProps.h>
#import "ABI43_0_0RCTConversions.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

@implementation ABI43_0_0RCTRootComponentView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RootProps>();
    _props = defaultProps;
  }

  return self;
}

#pragma mark - ABI43_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RootComponentDescriptor>();
}

@end
