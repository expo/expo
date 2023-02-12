/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGClipPath.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI48_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI48_0_0RNSVGClipPath

#ifdef RN_FABRIC_ENABLED
using namespace ABI48_0_0facebook::ABI48_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNSVGClipPathProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNSVGClipPathComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNSVGClipPathProps>(props);
  setCommonNodeProps(newProps, self);
  _props = std::static_pointer_cast<ABI48_0_0RNSVGClipPathProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
}
#endif // RN_FABRIC_ENABLED

- (void)parseReference
{
  self.dirty = false;
  [self.svgView defineClipPath:self clipPathName:self.name];
}

- (BOOL)isSimpleClipPath
{
  NSArray<ABI48_0_0RNSVGView *> *children = self.subviews;
  if (children.count == 1) {
    ABI48_0_0RNSVGView *child = children[0];
    if ([child class] != [ABI48_0_0RNSVGGroup class]) {
      return true;
    }
  }
  return false;
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSVGClipPathCls(void)
{
  return ABI48_0_0RNSVGClipPath.class;
}
#endif // RN_FABRIC_ENABLED
