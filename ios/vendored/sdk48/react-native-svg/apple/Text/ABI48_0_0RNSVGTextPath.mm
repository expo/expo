/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGTextPath.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI48_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI48_0_0RNSVGTextPath

#ifdef RN_FABRIC_ENABLED
using namespace ABI48_0_0facebook::ABI48_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNSVGTextPathProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNSVGTextPathComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNSVGTextPathProps>(props);

  self.href = ABI48_0_0RCTNSStringFromStringNilIfEmpty(newProps.href);
  self.side = ABI48_0_0RCTNSStringFromStringNilIfEmpty(newProps.side);
  self.method = ABI48_0_0RCTNSStringFromStringNilIfEmpty(newProps.method);
  self.midLine = ABI48_0_0RCTNSStringFromStringNilIfEmpty(newProps.midLine);
  self.spacing = ABI48_0_0RCTNSStringFromStringNilIfEmpty(newProps.spacing);
  self.startOffset = [ABI48_0_0RNSVGLength lengthWithString:ABI48_0_0RCTNSStringFromString(newProps.startOffset)];

  setCommonTextProps(newProps, self);
  _props = std::static_pointer_cast<ABI48_0_0RNSVGTextPathProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  _href = nil;
  _side = nil;
  _method = nil;
  _midLine = nil;
  _spacing = nil;
  _startOffset = nil;
}
#endif // RN_FABRIC_ENABLED

- (void)setHref:(NSString *)href
{
  if ([href isEqualToString:_href]) {
    return;
  }
  [self invalidate];
  _href = href;
}

- (void)setSide:(NSString *)side
{
  if ([side isEqualToString:_side]) {
    return;
  }
  [self invalidate];
  _side = side;
}

- (void)setMethod:(NSString *)method
{
  if ([method isEqualToString:_method]) {
    return;
  }
  [self invalidate];
  _method = method;
}

- (void)setMidLine:(NSString *)midLine
{
  if ([midLine isEqualToString:_midLine]) {
    return;
  }
  [self invalidate];
  _midLine = midLine;
}

- (void)setSpacing:(NSString *)spacing
{
  if ([spacing isEqualToString:_spacing]) {
    return;
  }
  [self invalidate];
  _spacing = spacing;
}

- (void)setStartOffset:(ABI48_0_0RNSVGLength *)startOffset
{
  if ([startOffset isEqualTo:_startOffset]) {
    return;
  }
  [self invalidate];
  _startOffset = startOffset;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
  [self renderGroupTo:context rect:rect];
}

- (CGPathRef)getPath:(CGContextRef)context
{
  return [self getGroupPath:context];
}

- (void)pushGlyphContext
{
  // TextPath do not affect the glyphContext
}

- (void)popGlyphContext
{
  // TextPath do not affect the glyphContext
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSVGTextPathCls(void)
{
  return ABI48_0_0RNSVGTextPath.class;
}
#endif // RN_FABRIC_ENABLED
