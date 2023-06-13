/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGRadialGradient.h"

#ifdef RN_FABRIC_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation RNSVGRadialGradient

#ifdef RN_FABRIC_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGRadialGradientProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGRadialGradientComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const RNSVGRadialGradientProps>(props);

  self.fx = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.fx)];
  self.fy = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.fy)];
  self.cx = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.cx)];
  self.cy = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.cy)];
  self.rx = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.rx)];
  self.ry = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.ry)];
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
  _props = std::static_pointer_cast<RNSVGRadialGradientProps const>(props);
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

- (void)setFx:(RNSVGLength *)fx
{
  if ([fx isEqualTo:_fx]) {
    return;
  }

  _fx = fx;
  [self invalidate];
}

- (void)setFy:(RNSVGLength *)fy
{
  if ([fy isEqualTo:_fy]) {
    return;
  }

  _fy = fy;
  [self invalidate];
}

- (void)setRx:(RNSVGLength *)rx
{
  if ([rx isEqualTo:_rx]) {
    return;
  }

  _rx = rx;
  [self invalidate];
}

- (void)setRy:(RNSVGLength *)ry
{
  if ([ry isEqualTo:_ry]) {
    return;
  }

  _ry = ry;
  [self invalidate];
}

- (void)setCx:(RNSVGLength *)cx
{
  if ([cx isEqualTo:_cx]) {
    return;
  }

  _cx = cx;
  [self invalidate];
}

- (void)setCy:(RNSVGLength *)cy
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

- (void)setGradientUnits:(RNSVGUnits)gradientUnits
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

- (RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}

- (void)parseReference
{
  self.dirty = false;
  NSArray<RNSVGLength *> *points = @[ self.fx, self.fy, self.rx, self.ry, self.cx, self.cy ];
  RNSVGPainter *painter = [[RNSVGPainter alloc] initWithPointsArray:points];
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
Class<RCTComponentViewProtocol> RNSVGRadialGradientCls(void)
{
  return RNSVGRadialGradient.class;
}
#endif // RN_FABRIC_ENABLED
