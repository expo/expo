/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGRect.h"
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI49_0_0RNSVGFabricConversions.h"
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@implementation ABI49_0_0RNSVGRect

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
using namespace ABI49_0_0facebook::ABI49_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI49_0_0RNSVGRectProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI49_0_0RNSVGRectComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI49_0_0RNSVGRectProps>(props);

  self.x = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.x)];
  self.y = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.y)];
  if (ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.height)) {
    self.rectheight = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.height)];
  }
  if (ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.width)) {
    self.rectwidth = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.width)];
  }
  self.rx = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.rx)];
  self.ry = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.ry)];

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<ABI49_0_0RNSVGRectProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  _x = nil;
  _y = nil;
  _rectwidth = nil;
  _rectheight = nil;
  _rx = nil;
  _ry = nil;
}

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

- (void)setX:(ABI49_0_0RNSVGLength *)x
{
  if ([x isEqualTo:_x]) {
    return;
  }
  [self invalidate];
  _x = x;
}

- (void)setY:(ABI49_0_0RNSVGLength *)y
{
  if ([y isEqualTo:_y]) {
    return;
  }
  [self invalidate];
  _y = y;
}

- (void)setRectwidth:(ABI49_0_0RNSVGLength *)rectwidth
{
  if ([rectwidth isEqualTo:_rectwidth]) {
    return;
  }
  [self invalidate];
  _rectwidth = rectwidth;
}

- (void)setRectheight:(ABI49_0_0RNSVGLength *)rectheight
{
  if ([rectheight isEqualTo:_rectheight]) {
    return;
  }
  [self invalidate];
  _rectheight = rectheight;
}

- (void)setRx:(ABI49_0_0RNSVGLength *)rx
{
  if ([rx isEqualTo:_rx]) {
    return;
  }
  [self invalidate];
  _rx = rx;
}

- (void)setRy:(ABI49_0_0RNSVGLength *)ry
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
  CGFloat x = [self relativeOnWidth:self.x];
  CGFloat y = [self relativeOnHeight:self.y];
  CGFloat width = [self relativeOnWidth:self.rectwidth];
  CGFloat height = [self relativeOnHeight:self.rectheight];

  if (self.rx != nil || self.ry != nil) {
    CGFloat rx = 0;
    CGFloat ry = 0;
    if (self.rx == nil) {
      ry = [self relativeOnHeight:self.ry];
      rx = ry;
    } else if (self.ry == nil) {
      rx = [self relativeOnWidth:self.rx];
      ry = rx;
    } else {
      rx = [self relativeOnWidth:self.rx];
      ry = [self relativeOnHeight:self.ry];
    }

    if (rx > width / 2) {
      rx = width / 2;
    }

    if (ry > height / 2) {
      ry = height / 2;
    }

    CGPathAddRoundedRect(path, nil, CGRectMake(x, y, width, height), rx, ry);
  } else {
    CGPathAddRect(path, nil, CGRectMake(x, y, width, height));
  }

  return (CGPathRef)CFAutorelease(path);
}

@end

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RNSVGRectCls(void)
{
  return ABI49_0_0RNSVGRect.class;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
