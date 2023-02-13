/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGCircle.h"
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI48_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI48_0_0RNSVGCircle

#ifdef RN_FABRIC_ENABLED
using namespace ABI48_0_0facebook::ABI48_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNSVGCircleProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNSVGCircleComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNSVGCircleProps>(props);

  self.cx = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.cx)];
  self.cy = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.cy)];
  self.r = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.r)];

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<ABI48_0_0RNSVGCircleProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _cx = nil;
  _cy = nil;
  _r = nil;
}
#endif // RN_FABRIC_ENABLED

- (void)setCx:(ABI48_0_0RNSVGLength *)cx
{
  if ([cx isEqualTo:_cx]) {
    return;
  }
  [self invalidate];
  _cx = cx;
}

- (void)setCy:(ABI48_0_0RNSVGLength *)cy
{
  if ([cy isEqualTo:_cy]) {
    return;
  }
  [self invalidate];
  _cy = cy;
}

- (void)setR:(ABI48_0_0RNSVGLength *)r
{
  if ([r isEqualTo:_r]) {
    return;
  }
  [self invalidate];
  _r = r;
}

- (CGPathRef)getPath:(CGContextRef)context
{
  CGMutablePathRef path = CGPathCreateMutable();
  CGFloat cx = [self relativeOnWidth:self.cx];
  CGFloat cy = [self relativeOnHeight:self.cy];
  CGFloat r = [self relativeOnOther:self.r];
  CGPathAddArc(path, nil, cx, cy, r, 0, 2 * (CGFloat)M_PI, NO);
  return (CGPathRef)CFAutorelease(path);
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSVGCircleCls(void)
{
  return ABI48_0_0RNSVGCircle.class;
}
#endif // RN_FABRIC_ENABLED
