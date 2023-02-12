/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI48_0_0RNSVGLinearGradient.h"
#import "ABI48_0_0RNSVGBrushType.h"
#import "ABI48_0_0RNSVGPainter.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI48_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI48_0_0RNSVGLinearGradient

#ifdef RN_FABRIC_ENABLED
using namespace ABI48_0_0facebook::ABI48_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNSVGLinearGradientProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNSVGLinearGradientComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNSVGLinearGradientProps>(props);

  self.x1 = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.x1)];
  self.y1 = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.y1)];
  self.x2 = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.x2)];
  self.y2 = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.y2)];
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
  _props = std::static_pointer_cast<ABI48_0_0RNSVGLinearGradientProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _x1 = nil;
  _y1 = nil;
  _x2 = nil;
  _y2 = nil;
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

- (void)setX1:(ABI48_0_0RNSVGLength *)x1
{
  if ([x1 isEqualTo:_x1]) {
    return;
  }

  _x1 = x1;
  [self invalidate];
}

- (void)setY1:(ABI48_0_0RNSVGLength *)y1
{
  if ([y1 isEqualTo:_y1]) {
    return;
  }

  _y1 = y1;
  [self invalidate];
}

- (void)setX2:(ABI48_0_0RNSVGLength *)x2
{
  if ([x2 isEqualTo:_x2]) {
    return;
  }

  _x2 = x2;
  [self invalidate];
}

- (void)setY2:(ABI48_0_0RNSVGLength *)y2
{
  if ([y2 isEqualTo:_y2]) {
    return;
  }

  _y2 = y2;
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
  NSArray<ABI48_0_0RNSVGLength *> *points = @[ self.x1, self.y1, self.x2, self.y2 ];
  ABI48_0_0RNSVGPainter *painter = [[ABI48_0_0RNSVGPainter alloc] initWithPointsArray:points];
  [painter setUnits:self.gradientUnits];
  [painter setTransform:self.gradientTransform];
  [painter setLinearGradientColors:self.gradient];

  if (self.gradientUnits == kRNSVGUnitsUserSpaceOnUse) {
    [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
  }

  [self.svgView definePainter:painter painterName:self.name];
}
@end

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSVGLinearGradientCls(void)
{
  return ABI48_0_0RNSVGLinearGradient.class;
}
#endif // RN_FABRIC_ENABLED
