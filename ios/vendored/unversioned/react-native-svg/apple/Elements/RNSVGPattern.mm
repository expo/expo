/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "RNSVGPattern.h"
#import "RNSVGBrushType.h"
#import "RNSVGNode.h"
#import "RNSVGPainter.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RCT_NEW_ARCH_ENABLED

@implementation RNSVGPattern

#ifdef RCT_NEW_ARCH_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGPatternProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGPatternComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = static_cast<const RNSVGPatternProps &>(*props);

  self.x = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.x)];
  self.y = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.y)];
  if (RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.patternheight = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.height)];
  }
  if (RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.patternwidth = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.width)];
  }
  self.patternUnits = newProps.patternUnits == 0 ? kRNSVGUnitsObjectBoundingBox : kRNSVGUnitsUserSpaceOnUse;
  self.patternContentUnits =
      newProps.patternContentUnits == 0 ? kRNSVGUnitsObjectBoundingBox : kRNSVGUnitsUserSpaceOnUse;
  if (newProps.patternTransform.size() == 6) {
    self.patternTransform = CGAffineTransformMake(
        newProps.patternTransform.at(0),
        newProps.patternTransform.at(1),
        newProps.patternTransform.at(2),
        newProps.patternTransform.at(3),
        newProps.patternTransform.at(4),
        newProps.patternTransform.at(5));
  }
  self.minX = newProps.minX;
  self.minY = newProps.minY;
  self.vbWidth = newProps.vbWidth;
  self.vbHeight = newProps.vbHeight;
  self.align = RCTNSStringFromStringNilIfEmpty(newProps.align);
  self.meetOrSlice = intToRNSVGVBMOS(newProps.meetOrSlice);

  setCommonGroupProps(newProps, self);
  _props = std::static_pointer_cast<RNSVGPatternProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _x = nil;
  _y = nil;
  _patternheight = nil;
  _patternwidth = nil;
  _patternUnits = kRNSVGUnitsObjectBoundingBox;
  _patternContentUnits = kRNSVGUnitsObjectBoundingBox;
  _patternTransform = CGAffineTransformIdentity;

  _minX = 0;
  _minY = 0;
  _vbWidth = 0;
  _vbHeight = 0;
  _align = nil;
  _meetOrSlice = kRNSVGVBMOSMeet;
}
#endif // RCT_NEW_ARCH_ENABLED

- (instancetype)init
{
  if (self = [super init]) {
    _patternTransform = CGAffineTransformIdentity;
  }
  return self;
}

- (RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}

- (void)parseReference
{
  self.dirty = false;
  NSArray<RNSVGLength *> *points = @[ self.x, self.y, self.patternwidth, self.patternheight ];
  RNSVGPainter *painter = [[RNSVGPainter alloc] initWithPointsArray:points];
  [painter setUnits:self.patternUnits];
  [painter setContentUnits:self.patternContentUnits];
  [painter setTransform:self.patternTransform];
  [painter setPattern:self];

  if (self.patternUnits == kRNSVGUnitsUserSpaceOnUse || self.patternContentUnits == kRNSVGUnitsUserSpaceOnUse) {
    [painter setUserSpaceBoundingBox:[self.svgView getContextBounds]];
  }

  [self.svgView definePainter:painter painterName:self.name];
}

- (void)setX:(RNSVGLength *)x
{
  if ([x isEqualTo:_x]) {
    return;
  }

  _x = x;
  [self invalidate];
}

- (void)setY:(RNSVGLength *)y
{
  if ([y isEqualTo:_y]) {
    return;
  }

  _y = y;
  [self invalidate];
}

- (void)setPatternwidth:(RNSVGLength *)patternwidth
{
  if ([patternwidth isEqualTo:_patternwidth]) {
    return;
  }

  _patternwidth = patternwidth;
  [self invalidate];
}

- (void)setPatternheight:(RNSVGLength *)patternheight
{
  if ([patternheight isEqualTo:_patternheight]) {
    return;
  }

  _patternheight = patternheight;
  [self invalidate];
}

- (void)setPatternUnits:(RNSVGUnits)patternUnits
{
  if (patternUnits == _patternUnits) {
    return;
  }

  _patternUnits = patternUnits;
  [self invalidate];
}

- (void)setPatternContentUnits:(RNSVGUnits)patternContentUnits
{
  if (patternContentUnits == _patternContentUnits) {
    return;
  }

  _patternContentUnits = patternContentUnits;
  [self invalidate];
}

- (void)setPatternTransform:(CGAffineTransform)patternTransform
{
  _patternTransform = patternTransform;
  [self invalidate];
}

- (void)setMinX:(CGFloat)minX
{
  if (minX == _minX) {
    return;
  }

  [self invalidate];
  _minX = minX;
}

- (void)setMinY:(CGFloat)minY
{
  if (minY == _minY) {
    return;
  }

  [self invalidate];
  _minY = minY;
}

- (void)setVbWidth:(CGFloat)vbWidth
{
  if (vbWidth == _vbWidth) {
    return;
  }

  [self invalidate];
  _vbWidth = vbWidth;
}

- (void)setVbHeight:(CGFloat)vbHeight
{
  if (_vbHeight == vbHeight) {
    return;
  }

  [self invalidate];
  _vbHeight = vbHeight;
}

- (void)setAlign:(NSString *)align
{
  if ([align isEqualToString:_align]) {
    return;
  }

  [self invalidate];
  _align = align;
}

- (void)setMeetOrSlice:(RNSVGVBMOS)meetOrSlice
{
  if (meetOrSlice == _meetOrSlice) {
    return;
  }

  [self invalidate];
  _meetOrSlice = meetOrSlice;
}

@end

#ifdef RCT_NEW_ARCH_ENABLED
Class<RCTComponentViewProtocol> RNSVGPatternCls(void)
{
  return RNSVGPattern.class;
}
#endif // RCT_NEW_ARCH_ENABLED
