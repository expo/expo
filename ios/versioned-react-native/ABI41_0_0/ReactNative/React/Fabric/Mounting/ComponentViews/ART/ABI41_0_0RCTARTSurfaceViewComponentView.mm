/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTARTSurfaceViewComponentView.h"
#import <ABI41_0_0React/uimanager/ComponentDescriptorProvider.h>
#import "ABI41_0_0RCTARTSurfaceViewComponentDescriptor.h"

#import "ABI41_0_0FBABI41_0_0RCTFabricComponentsPlugins.h"

using namespace ABI41_0_0facebook::ABI41_0_0React;

@implementation ABI41_0_0RCTARTSurfaceViewComponentView {
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI41_0_0RCTARTSurfaceViewProps>();
    _props = defaultProps;
  }

  return self;
}

#pragma mark - ABI41_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI41_0_0RCTARTSurfaceComponentDescriptor>();
}

@end

Class<ABI41_0_0RCTComponentViewProtocol> ABI41_0_0RCTARTSurfaceViewCls(void)
{
  return ABI41_0_0RCTARTSurfaceViewComponentView.class;
}
