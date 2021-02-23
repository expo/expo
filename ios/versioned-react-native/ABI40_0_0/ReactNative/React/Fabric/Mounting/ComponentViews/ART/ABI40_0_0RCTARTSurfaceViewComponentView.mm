/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTARTSurfaceViewComponentView.h"
#import <ABI40_0_0React/uimanager/ComponentDescriptorProvider.h>
#import "ABI40_0_0RCTARTSurfaceViewComponentDescriptor.h"

#import "ABI40_0_0FBABI40_0_0RCTFabricComponentsPlugins.h"

using namespace ABI40_0_0facebook::ABI40_0_0React;

@implementation ABI40_0_0RCTARTSurfaceViewComponentView {
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI40_0_0RCTARTSurfaceViewProps>();
    _props = defaultProps;
  }

  return self;
}

#pragma mark - ABI40_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI40_0_0RCTARTSurfaceComponentDescriptor>();
}

@end

Class<ABI40_0_0RCTComponentViewProtocol> ABI40_0_0RCTARTSurfaceViewCls(void)
{
  return ABI40_0_0RCTARTSurfaceViewComponentView.class;
}
