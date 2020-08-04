/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTARTSurfaceViewComponentView.h"
#import <ABI38_0_0React/uimanager/ComponentDescriptorProvider.h>
#import "ABI38_0_0RCTARTSurfaceViewComponentDescriptor.h"

using namespace ABI38_0_0facebook::ABI38_0_0React;

@implementation ABI38_0_0RCTARTSurfaceViewComponentView {
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI38_0_0RCTARTSurfaceViewProps>();
    _props = defaultProps;
  }

  return self;
}

#pragma mark - ABI38_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI38_0_0RCTARTSurfaceComponentDescriptor>();
}

@end
