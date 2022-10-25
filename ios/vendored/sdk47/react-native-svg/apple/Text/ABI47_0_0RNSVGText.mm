/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGText.h"
#import <CoreText/CoreText.h>
#import <ABI47_0_0React/ABI47_0_0RCTFont.h>
#import "ABI47_0_0RNSVGGlyphContext.h"
#import "ABI47_0_0RNSVGTextPath.h"
#import "ABI47_0_0RNSVGTextProperties.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI47_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI47_0_0RNSVGText {
  ABI47_0_0RNSVGGlyphContext *_glyphContext;
  NSString *_alignmentBaseline;
  NSString *_baselineShift;
  CGFloat cachedAdvance;
}

#ifdef RN_FABRIC_ENABLED
using namespace ABI47_0_0facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI47_0_0RNSVGTextProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI47_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI47_0_0RNSVGTextComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI47_0_0RNSVGTextProps>(props);

  setCommonTextProps(newProps, self);
  _props = std::static_pointer_cast<ABI47_0_0RNSVGTextProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  _deltaX = nil;
  _deltaY = nil;
  _positionX = nil;
  _positionY = nil;
  _rotate = nil;
  _inlineSize = nil;
  _textLength = nil;
  _baselineShift = nil;
  _lengthAdjust = nil;
  _alignmentBaseline = nil;

  _glyphContext = nil;
  _alignmentBaseline = nil;
  _baselineShift = nil;
  cachedAdvance = 0;
}
#endif // RN_FABRIC_ENABLED

- (void)invalidate
{
  if (self.dirty || self.merging) {
    return;
  }
  [super invalidate];
  [self clearChildCache];
}

- (void)clearPath
{
  [super clearPath];
  cachedAdvance = NAN;
}

- (void)setInlineSize:(ABI47_0_0RNSVGLength *)inlineSize
{
  if ([inlineSize isEqualTo:_inlineSize]) {
    return;
  }
  [self invalidate];
  _inlineSize = inlineSize;
}

- (void)setTextLength:(ABI47_0_0RNSVGLength *)textLength
{
  if ([textLength isEqualTo:_textLength]) {
    return;
  }
  [self invalidate];
  _textLength = textLength;
}

- (void)setBaselineShift:(NSString *)baselineShift
{
  if ([baselineShift isEqualToString:_baselineShift]) {
    return;
  }
  [self invalidate];
  _baselineShift = baselineShift;
}

- (void)setLengthAdjust:(NSString *)lengthAdjust
{
  if ([lengthAdjust isEqualToString:_lengthAdjust]) {
    return;
  }
  [self invalidate];
  _lengthAdjust = lengthAdjust;
}

- (void)setAlignmentBaseline:(NSString *)alignmentBaseline
{
  if ([alignmentBaseline isEqualToString:_alignmentBaseline]) {
    return;
  }
  [self invalidate];
  _alignmentBaseline = alignmentBaseline;
}

- (void)setDeltaX:(NSArray<ABI47_0_0RNSVGLength *> *)deltaX
{
  if (deltaX == _deltaX) {
    return;
  }
  [self invalidate];
  _deltaX = deltaX;
}

- (void)setDeltaY:(NSArray<ABI47_0_0RNSVGLength *> *)deltaY
{
  if (deltaY == _deltaY) {
    return;
  }
  [self invalidate];
  _deltaY = deltaY;
}

- (void)setPositionX:(NSArray<ABI47_0_0RNSVGLength *> *)positionX
{
  if (positionX == _positionX) {
    return;
  }
  [self invalidate];
  _positionX = positionX;
}

- (void)setPositionY:(NSArray<ABI47_0_0RNSVGLength *> *)positionY
{
  if (positionY == _positionY) {
    return;
  }
  [self invalidate];
  _positionY = positionY;
}

- (void)setRotate:(NSArray<ABI47_0_0RNSVGLength *> *)rotate
{
  if (rotate == _rotate) {
    return;
  }
  [self invalidate];
  _rotate = rotate;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
  CGContextSaveGState(context);
  [self clip:context];
  [self setupGlyphContext:context];
  [self pushGlyphContext];
  [super renderGroupTo:context rect:rect];
  [self popGlyphContext];
  CGContextRestoreGState(context);
}

- (void)setupGlyphContext:(CGContextRef)context
{
  CGRect bounds = CGContextGetClipBoundingBox(context);
  CGSize size = bounds.size;
  _glyphContext = [[ABI47_0_0RNSVGGlyphContext alloc] initWithWidth:size.width height:size.height];
}

- (CGPathRef)getGroupPath:(CGContextRef)context
{
  CGPathRef path = self.path;
  if (path) {
    return path;
  }
  [self pushGlyphContext];
  path = [super getPath:context];
  [self popGlyphContext];
  self.path = path;
  return path;
}

- (CGPathRef)getPath:(CGContextRef)context
{
  CGPathRef path = self.path;
  if (path) {
    return path;
  }
  [self setupGlyphContext:context];
  return [self getGroupPath:context];
}

- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect
{
  [self pushGlyphContext];
  [super renderGroupTo:context rect:rect];
  [self popGlyphContext];
}

// TODO: Optimisation required
- (ABI47_0_0RNSVGText *)textRoot
{
  ABI47_0_0RNSVGText *root = self;
  while (root && [root class] != [ABI47_0_0RNSVGText class]) {
    if (![root isKindOfClass:[ABI47_0_0RNSVGText class]]) {
      // todo: throw exception here
      break;
    }
    root = (ABI47_0_0RNSVGText *)[root superview];
  }

  return root;
}

- (NSString *)alignmentBaseline
{
  if (_alignmentBaseline != nil) {
    return _alignmentBaseline;
  }

  ABI47_0_0RNSVGPlatformView *parent = self.superview;
  while (parent != nil) {
    if ([parent isKindOfClass:[ABI47_0_0RNSVGText class]]) {
      ABI47_0_0RNSVGText *node = (ABI47_0_0RNSVGText *)parent;
      NSString *baseline = node.alignmentBaseline;
      if (baseline != nil) {
        _alignmentBaseline = baseline;
        return baseline;
      }
    }
    parent = [parent superview];
  }

  if (_alignmentBaseline == nil) {
    _alignmentBaseline = ABI47_0_0RNSVGAlignmentBaselineStrings[0];
  }
  return _alignmentBaseline;
}

- (NSString *)baselineShift
{
  if (_baselineShift != nil) {
    return _baselineShift;
  }

  ABI47_0_0RNSVGPlatformView *parent = [self superview];
  while (parent != nil) {
    if ([parent isKindOfClass:[ABI47_0_0RNSVGText class]]) {
      ABI47_0_0RNSVGText *node = (ABI47_0_0RNSVGText *)parent;
      NSString *baselineShift = node.baselineShift;
      if (baselineShift != nil) {
        _baselineShift = baselineShift;
        return baselineShift;
      }
    }
    parent = [parent superview];
  }

  // set default value
  _baselineShift = @"";

  return _baselineShift;
}

- (ABI47_0_0RNSVGGlyphContext *)getGlyphContext
{
  return _glyphContext;
}

- (void)pushGlyphContext
{
  [[self.textRoot getGlyphContext] pushContext:self
                                          font:self.font
                                             x:self.positionX
                                             y:self.positionY
                                        deltaX:self.deltaX
                                        deltaY:self.deltaY
                                        rotate:self.rotate];
}

- (void)popGlyphContext
{
  [[self.textRoot getGlyphContext] popContext];
}

- (CTFontRef)getFontFromContext
{
  return [[self.textRoot getGlyphContext] getGlyphFont];
}

- (ABI47_0_0RNSVGText *)getTextAnchorRoot
{
  ABI47_0_0RNSVGGlyphContext *gc = [self.textRoot getGlyphContext];
  NSArray *font = [gc getFontContext];
  ABI47_0_0RNSVGText *node = self;
  ABI47_0_0RNSVGPlatformView *parent = [self superview];
  for (NSInteger i = [font count] - 1; i >= 0; i--) {
    ABI47_0_0RNSVGFontData *fontData = [font objectAtIndex:i];
    if (![parent isKindOfClass:[ABI47_0_0RNSVGText class]] || fontData->textAnchor == ABI47_0_0RNSVGTextAnchorStart ||
        node.positionX != nil) {
      return node;
    }
    node = (ABI47_0_0RNSVGText *)parent;
    parent = [node superview];
  }
  return node;
}

- (CGFloat)getSubtreeTextChunksTotalAdvance
{
  if (!isnan(cachedAdvance)) {
    return cachedAdvance;
  }
  CGFloat advance = 0;
  for (ABI47_0_0RNSVGView *node in self.subviews) {
    if ([node isKindOfClass:[ABI47_0_0RNSVGText class]]) {
      ABI47_0_0RNSVGText *text = (ABI47_0_0RNSVGText *)node;
      advance += [text getSubtreeTextChunksTotalAdvance];
    }
  }
  cachedAdvance = advance;
  return advance;
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSVGTextCls(void)
{
  return ABI47_0_0RNSVGText.class;
}
#endif // RN_FABRIC_ENABLED
