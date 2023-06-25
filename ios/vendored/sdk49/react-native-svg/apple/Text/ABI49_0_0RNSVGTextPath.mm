/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGTextPath.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI49_0_0RNSVGFabricConversions.h"
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@implementation ABI49_0_0RNSVGTextPath

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
using namespace ABI49_0_0facebook::ABI49_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI49_0_0RNSVGTextPathProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI49_0_0RNSVGTextPathComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI49_0_0RNSVGTextPathProps>(props);

  self.href = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.href);
  self.side = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.side);
  self.method = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.method);
  self.midLine = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.midLine);
  self.spacing = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newProps.spacing);
  self.startOffset = [ABI49_0_0RNSVGLength lengthWithString:ABI49_0_0RCTNSStringFromString(newProps.startOffset)];

  setCommonTextProps(newProps, self);
  _props = std::static_pointer_cast<ABI49_0_0RNSVGTextPathProps const>(props);
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
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

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

- (void)setStartOffset:(ABI49_0_0RNSVGLength *)startOffset
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

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RNSVGTextPathCls(void)
{
  return ABI49_0_0RNSVGTextPath.class;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
