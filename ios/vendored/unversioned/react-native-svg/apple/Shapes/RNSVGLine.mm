/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGLine.h"
#import <React/RCTLog.h>

#ifdef RN_FABRIC_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation RNSVGLine

#ifdef RN_FABRIC_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGLineProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGLineComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const RNSVGLineProps>(props);

  self.x1 = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.x1)];
  self.y1 = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.y1)];
  self.x2 = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.x2)];
  self.y2 = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.y2)];

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<RNSVGLineProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _x1 = nil;
  _y1 = nil;
  _x2 = nil;
  _y2 = nil;
}
#endif // RN_FABRIC_ENABLED

- (void)setX1:(RNSVGLength *)x1
{
  if ([x1 isEqualTo:_x1]) {
    return;
  }
  [self invalidate];
  _x1 = x1;
}

- (void)setY1:(RNSVGLength *)y1
{
  if ([y1 isEqualTo:_y1]) {
    return;
  }
  [self invalidate];
  _y1 = y1;
}

- (void)setX2:(RNSVGLength *)x2
{
  if ([x2 isEqualTo:_x2]) {
    return;
  }
  [self invalidate];
  _x2 = x2;
}

- (void)setY2:(RNSVGLength *)y2
{
  if ([y2 isEqualTo:_y2]) {
    return;
  }
  [self invalidate];
  _y2 = y2;
}

- (CGPathRef)getPath:(CGContextRef)context
{
  CGMutablePathRef path = CGPathCreateMutable();
  CGFloat x1 = [self relativeOnWidth:self.x1];
  CGFloat y1 = [self relativeOnHeight:self.y1];
  CGFloat x2 = [self relativeOnWidth:self.x2];
  CGFloat y2 = [self relativeOnHeight:self.y2];
  CGPathMoveToPoint(path, nil, x1, y1);
  CGPathAddLineToPoint(path, nil, x2, y2);

  return (CGPathRef)CFAutorelease(path);
}

@end

#ifdef RN_FABRIC_ENABLED
Class<RCTComponentViewProtocol> RNSVGLineCls(void)
{
  return RNSVGLine.class;
}
#endif // RN_FABRIC_ENABLED
