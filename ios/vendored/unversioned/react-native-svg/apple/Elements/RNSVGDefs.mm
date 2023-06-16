/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGDefs.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RCT_NEW_ARCH_ENABLED

@implementation RNSVGDefs

#ifdef RCT_NEW_ARCH_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGDefsProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGDefsComponentDescriptor>();
}
#endif // RCT_NEW_ARCH_ENABLED

- (void)renderTo:(CGContextRef)context
{
  // Defs do not render
}

- (void)parseReference
{
  self.dirty = false;
  [self traverseSubviews:^(RNSVGNode *node) {
    if ([node isKindOfClass:[RNSVGNode class]]) {
      [node parseReference];
    }
    return YES;
  }];
}

- (RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}

@end

#ifdef RCT_NEW_ARCH_ENABLED
Class<RCTComponentViewProtocol> RNSVGDefsCls(void)
{
  return RNSVGDefs.class;
}
#endif // RCT_NEW_ARCH_ENABLED
