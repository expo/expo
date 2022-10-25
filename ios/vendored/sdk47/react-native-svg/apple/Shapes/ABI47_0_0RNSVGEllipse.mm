/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGEllipse.h"
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI47_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI47_0_0RNSVGEllipse

#ifdef RN_FABRIC_ENABLED
using namespace ABI47_0_0facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI47_0_0RNSVGEllipseProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI47_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI47_0_0RNSVGEllipseComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI47_0_0RNSVGEllipseProps>(props);

  self.cx = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.cx)];
  self.cy = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.cy)];
  self.rx = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.rx)];
  self.ry = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.ry)];

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<ABI47_0_0RNSVGEllipseProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _cx = nil;
  _cy = nil;
  _rx = nil;
  _ry = nil;
}
#endif // RN_FABRIC_ENABLED

- (void)setCx:(ABI47_0_0RNSVGLength *)cx
{
  if ([cx isEqualTo:_cx]) {
    return;
  }
  [self invalidate];
  _cx = cx;
}

- (void)setCy:(ABI47_0_0RNSVGLength *)cy
{
  if ([cy isEqualTo:_cy]) {
    return;
  }
  [self invalidate];
  _cy = cy;
}

- (void)setRx:(ABI47_0_0RNSVGLength *)rx
{
  if ([rx isEqualTo:_rx]) {
    return;
  }
  [self invalidate];
  _rx = rx;
}

- (void)setRy:(ABI47_0_0RNSVGLength *)ry
{
  if ([ry isEqualTo:_ry]) {
    return;
  }
  [self invalidate];
  _ry = ry;
}

- (CGPathRef)getPath:(CGContextRef)context
{
  CGMutablePathRef path = CGPathCreateMutable();
  CGFloat cx = [self relativeOnWidth:self.cx];
  CGFloat cy = [self relativeOnHeight:self.cy];
  CGFloat rx = [self relativeOnWidth:self.rx];
  CGFloat ry = [self relativeOnHeight:self.ry];
  CGPathAddEllipseInRect(path, nil, CGRectMake(cx - rx, cy - ry, rx * 2, ry * 2));
  return (CGPathRef)CFAutorelease(path);
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSVGEllipseCls(void)
{
  return ABI47_0_0RNSVGEllipse.class;
}
#endif // RN_FABRIC_ENABLED
