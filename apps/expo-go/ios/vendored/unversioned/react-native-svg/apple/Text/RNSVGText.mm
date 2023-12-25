/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGText.h"
#import <CoreText/CoreText.h>
#import <React/RCTFont.h>
#import "RNSVGGlyphContext.h"
#import "RNSVGTextPath.h"
#import "RNSVGTextProperties.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RCT_NEW_ARCH_ENABLED

@implementation RNSVGText {
  RNSVGGlyphContext *_glyphContext;
  NSString *_alignmentBaseline;
  NSString *_baselineShift;
  CGFloat cachedAdvance;
}

#ifdef RCT_NEW_ARCH_ENABLED
using namespace facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNSVGTextProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGTextComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = static_cast<const RNSVGTextProps &>(*props);

  setCommonTextProps(newProps, self);
  _props = std::static_pointer_cast<RNSVGTextProps const>(props);
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
#endif // RCT_NEW_ARCH_ENABLED

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

- (void)setInlineSize:(RNSVGLength *)inlineSize
{
  if ([inlineSize isEqualTo:_inlineSize]) {
    return;
  }
  [self invalidate];
  _inlineSize = inlineSize;
}

- (void)setTextLength:(RNSVGLength *)textLength
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

- (void)setDeltaX:(NSArray<RNSVGLength *> *)deltaX
{
  if (deltaX == _deltaX) {
    return;
  }
  [self invalidate];
  _deltaX = deltaX;
}

- (void)setDeltaY:(NSArray<RNSVGLength *> *)deltaY
{
  if (deltaY == _deltaY) {
    return;
  }
  [self invalidate];
  _deltaY = deltaY;
}

- (void)setPositionX:(NSArray<RNSVGLength *> *)positionX
{
  if (positionX == _positionX) {
    return;
  }
  [self invalidate];
  _positionX = positionX;
}

- (void)setPositionY:(NSArray<RNSVGLength *> *)positionY
{
  if (positionY == _positionY) {
    return;
  }
  [self invalidate];
  _positionY = positionY;
}

- (void)setRotate:(NSArray<RNSVGLength *> *)rotate
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
  _glyphContext = [[RNSVGGlyphContext alloc] initWithWidth:size.width height:size.height];
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
- (RNSVGText *)textRoot
{
  RNSVGText *root = self;
  while (root && [root class] != [RNSVGText class]) {
    if (![root isKindOfClass:[RNSVGText class]]) {
      // todo: throw exception here
      break;
    }
    root = (RNSVGText *)[root superview];
  }

  return root;
}

- (NSString *)alignmentBaseline
{
  if (_alignmentBaseline != nil) {
    return _alignmentBaseline;
  }

  RNSVGPlatformView *parent = self.superview;
  while (parent != nil) {
    if ([parent isKindOfClass:[RNSVGText class]]) {
      RNSVGText *node = (RNSVGText *)parent;
      NSString *baseline = node.alignmentBaseline;
      if (baseline != nil) {
        _alignmentBaseline = baseline;
        return baseline;
      }
    }
    parent = [parent superview];
  }

  if (_alignmentBaseline == nil) {
    _alignmentBaseline = RNSVGAlignmentBaselineStrings[0];
  }
  return _alignmentBaseline;
}

- (NSString *)baselineShift
{
  if (_baselineShift != nil) {
    return _baselineShift;
  }

  RNSVGPlatformView *parent = [self superview];
  while (parent != nil) {
    if ([parent isKindOfClass:[RNSVGText class]]) {
      RNSVGText *node = (RNSVGText *)parent;
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

- (RNSVGGlyphContext *)getGlyphContext
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

- (RNSVGText *)getTextAnchorRoot
{
  RNSVGGlyphContext *gc = [self.textRoot getGlyphContext];
  NSArray *font = [gc getFontContext];
  RNSVGText *node = self;
  RNSVGPlatformView *parent = [self superview];
  for (NSInteger i = [font count] - 1; i >= 0; i--) {
    RNSVGFontData *fontData = [font objectAtIndex:i];
    if (![parent isKindOfClass:[RNSVGText class]] || fontData->textAnchor == RNSVGTextAnchorStart ||
        node.positionX != nil) {
      return node;
    }
    node = (RNSVGText *)parent;
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
  for (RNSVGView *node in self.subviews) {
    if ([node isKindOfClass:[RNSVGText class]]) {
      RNSVGText *text = (RNSVGText *)node;
      advance += [text getSubtreeTextChunksTotalAdvance];
    }
  }
  cachedAdvance = advance;
  return advance;
}

@end

#ifdef RCT_NEW_ARCH_ENABLED
Class<RCTComponentViewProtocol> RNSVGTextCls(void)
{
  return RNSVGText.class;
}
#endif // RCT_NEW_ARCH_ENABLED
