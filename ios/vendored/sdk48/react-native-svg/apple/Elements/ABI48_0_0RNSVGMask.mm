/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI48_0_0RNSVGMask.h"
#import "ABI48_0_0RNSVGBrushType.h"
#import "ABI48_0_0RNSVGNode.h"
#import "ABI48_0_0RNSVGPainter.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI48_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI48_0_0RNSVGMask

#ifdef RN_FABRIC_ENABLED
using namespace ABI48_0_0facebook::ABI48_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNSVGMaskProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNSVGMaskComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNSVGMaskProps>(props);

  self.x = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.x)];
  self.y = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.y)];
  if (ABI48_0_0RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.maskheight = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.height)];
  }
  if (ABI48_0_0RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.maskwidth = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.width)];
  }
  self.maskUnits = newProps.maskUnits == 0 ? kRNSVGUnitsObjectBoundingBox : kRNSVGUnitsUserSpaceOnUse;
  self.maskContentUnits = newProps.maskUnits == 0 ? kRNSVGUnitsObjectBoundingBox : kRNSVGUnitsUserSpaceOnUse;
  if (newProps.maskTransform.size() == 6) {
    self.maskTransform = CGAffineTransformMake(
        newProps.maskTransform.at(0),
        newProps.maskTransform.at(1),
        newProps.maskTransform.at(2),
        newProps.maskTransform.at(3),
        newProps.maskTransform.at(4),
        newProps.maskTransform.at(5));
  }

  setCommonGroupProps(newProps, self);
  _props = std::static_pointer_cast<ABI48_0_0RNSVGMaskProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _x = nil;
  _y = nil;
  _maskheight = nil;
  _maskwidth = nil;
  _maskUnits = kRNSVGUnitsObjectBoundingBox;
  _maskContentUnits = kRNSVGUnitsObjectBoundingBox;
  _maskTransform = CGAffineTransformIdentity;
}
#endif // RN_FABRIC_ENABLED

- (ABI48_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}

- (void)parseReference
{
  self.dirty = false;
  [self.svgView defineMask:self maskName:self.name];
}

- (void)setX:(ABI48_0_0RNSVGLength *)x
{
  if ([x isEqualTo:_x]) {
    return;
  }

  _x = x;
  [self invalidate];
}

- (void)setY:(ABI48_0_0RNSVGLength *)y
{
  if ([y isEqualTo:_y]) {
    return;
  }

  _y = y;
  [self invalidate];
}

- (void)setMaskwidth:(ABI48_0_0RNSVGLength *)maskwidth
{
  if ([maskwidth isEqualTo:_maskwidth]) {
    return;
  }

  _maskwidth = maskwidth;
  [self invalidate];
}

- (void)setMaskheight:(ABI48_0_0RNSVGLength *)maskheight
{
  if ([maskheight isEqualTo:_maskheight]) {
    return;
  }

  _maskheight = maskheight;
  [self invalidate];
}

- (void)setMaskUnits:(ABI48_0_0RNSVGUnits)maskUnits
{
  if (maskUnits == _maskUnits) {
    return;
  }

  _maskUnits = maskUnits;
  [self invalidate];
}

- (void)setMaskContentUnits:(ABI48_0_0RNSVGUnits)maskContentUnits
{
  if (maskContentUnits == _maskContentUnits) {
    return;
  }

  _maskContentUnits = maskContentUnits;
  [self invalidate];
}

- (void)setMaskTransform:(CGAffineTransform)maskTransform
{
  _maskTransform = maskTransform;
  [self invalidate];
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSVGMaskCls(void)
{
  return ABI48_0_0RNSVGMask.class;
}
#endif // RN_FABRIC_ENABLED
