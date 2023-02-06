/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI48_0_0RNSVGRadialGradient.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI48_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI48_0_0RNSVGRadialGradient

#ifdef RN_FABRIC_ENABLED
using namespace ABI48_0_0facebook::ABI48_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNSVGRadialGradientProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNSVGRadialGradientComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNSVGRadialGradientProps>(props);

  self.fx = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.fx)];
  self.fy = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.fy)];
  self.cx = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.cx)];
  self.cy = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.cy)];
  self.rx = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.rx)];
  self.ry = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.ry)];
  if (newProps.gradient.size() > 0) {
    NSMutableArray<NSNumber *> *gradientArray = [NSMutableArray new];
    for (auto number : newProps.gradient) {
      [gradientArray addObject:[NSNumber numberWithDouble:number]];
    }
    self.gradient = gradientArray;
  }
  self.gradientUnits = newProps.gradientUnits == 0 ? kRNSVGUnitsObjectBoundingBox : kRNSVGUnitsUserSpaceOnUse;
  if (newProps.gradientTransform.size() == 6) {
    self.gradientTransform = CGAffineTransformMake(
        newProps.gradientTransform.at(0),
        newProps.gradientTransform.at(1),
        newProps.gradientTransform.at(2),
        newProps.gradientTransform.at(3),
        newProps.gradientTransform.at(4),
        newProps.gradientTransform.at(5));
  }

  setCommonNodeProps(newProps, self);
  _props = std::static_pointer_cast<ABI48_0_0RNSVGRadialGradientProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _fx = nil;
  _fy = nil;
  _cx = nil;
  _cy = nil;
  _rx = nil;
  _ry = nil;
  _gradient = nil;
  _gradientUnits = kRNSVGUnitsObjectBoundingBox;
  _gradientTransform = CGAffineTransformIdentity;
}
#endif // RN_FABRIC_ENABLED
- (instancetype)init
{
  if (self = [super init]) {
    _gradientTransform = CGAffineTransformIdentity;
  }
  return self;
}

- (void)setFx:(ABI48_0_0RNSVGLength *)fx
{
  if ([fx isEqualTo:_fx]) {
    return;
  }

  _fx = fx;
  [self invalidate];
}

- (void)setFy:(ABI48_0_0RNSVGLength *)fy
{
  if ([fy isEqualTo:_fy]) {
    return;
  }

  _fy = fy;
  [self invalidate];
}

- (void)setRx:(ABI48_0_0RNSVGLength *)rx
{
  if ([rx isEqualTo:_rx]) {
    return;
  }

  _rx = rx;
  [self invalidate];
}

- (void)setRy:(ABI48_0_0RNSVGLength *)ry
{
  if ([ry isEqualTo:_ry]) {
    return;
  }

  _ry = ry;
  [self invalidate];
}

- (void)setCx:(ABI48_0_0RNSVGLength *)cx
{
  if ([cx isEqualTo:_cx]) {
    return;
  }

  _cx = cx;
  [self invalidate];
}

- (void)setCy:(ABI48_0_0RNSVGLength *)cy
{
  if ([cy isEqualTo:_cy]) {
    return;
  }

  _cy = cy;
  [self invalidate];
}

- (void)setGradient:(NSArray<NSNumber *> *)gradient
{
  if (gradient == _gradient) {
    return;
  }

  _gradient = gradient;
  [self invalidate];
}

- (void)setGradientUnits:(ABI48_0_0RNSVGUnits)gradientUnits
{
  if (gradientUnits == _gradientUnits) {
    return;
  }

  _gradientUnits = gradientUnits;
  [self invalidate];
}

- (void)setGradientTransform:(CGAffineTransform)gradientTransform
{
  _gradientTransform = gradientTransform;
  [self invalidate];
}

- (ABI48_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}

- (void)parseReference
{
  self.dirty = false;
  NSArray<ABI48_0_0RNSVGLength *> *points = @[ self.fx, self.fy, self.rx, self.ry, self.cx, self.cy ];
  ABI48_0_0RNSVGPainter *painter = [[ABI48_0_0RNSVGPainter alloc] initWithPointsArray:points];
  [painter setUnits:self.gradientUnits];
  [painter setTransform:self.gradientTransform];
  [painter setRadialGradientColors:self.gradient];

  if (self.gradientUnits == kRNSVGUnitsUserSpaceOnUse) {
    [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
  }

  [self.svgView definePainter:painter painterName:self.name];
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSVGRadialGradientCls(void)
{
  return ABI48_0_0RNSVGRadialGradient.class;
}
#endif // RN_FABRIC_ENABLED
