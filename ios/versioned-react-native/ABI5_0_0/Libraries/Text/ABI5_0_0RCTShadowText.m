/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTShadowText.h"

#import "ABI5_0_0RCTAccessibilityManager.h"
#import "ABI5_0_0RCTUIManager.h"
#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTImageComponent.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTShadowRawText.h"
#import "ABI5_0_0RCTText.h"
#import "ABI5_0_0RCTUtils.h"

NSString *const ABI5_0_0RCTIsHighlightedAttributeName = @"IsHighlightedAttributeName";
NSString *const ABI5_0_0RCTReactABI5_0_0TagAttributeName = @"ReactABI5_0_0TagAttributeName";

@implementation ABI5_0_0RCTShadowText
{
  NSTextStorage *_cachedTextStorage;
  CGFloat _cachedTextStorageWidth;
  NSAttributedString *_cachedAttributedString;
  CGFloat _effectiveLetterSpacing;
}

static css_dim_t ABI5_0_0RCTMeasure(void *context, float width, css_measure_mode_t widthMode, float height, css_measure_mode_t heightMode)
{
  ABI5_0_0RCTShadowText *shadowText = (__bridge ABI5_0_0RCTShadowText *)context;
  NSTextStorage *textStorage = [shadowText buildTextStorageForWidth:width widthMode:widthMode];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  CGSize computedSize = [layoutManager usedRectForTextContainer:textContainer].size;

  css_dim_t result;
  result.dimensions[CSS_WIDTH] = ABI5_0_0RCTCeilPixelValue(computedSize.width);
  if (shadowText->_effectiveLetterSpacing < 0) {
    result.dimensions[CSS_WIDTH] -= shadowText->_effectiveLetterSpacing;
  }
  result.dimensions[CSS_HEIGHT] = ABI5_0_0RCTCeilPixelValue(computedSize.height);
  return result;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _fontSize = NAN;
    _letterSpacing = NAN;
    _isHighlighted = NO;
    _textDecorationStyle = NSUnderlineStyleSingle;
    _opacity = 1.0;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(contentSizeMultiplierDidChange:)
                                                 name:ABI5_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  return [[superDescription substringToIndex:superDescription.length - 1] stringByAppendingFormat:@"; text: %@>", [self attributedString].string];
}

- (void)contentSizeMultiplierDidChange:(NSNotification *)note
{
  [self dirtyLayout];
  [self dirtyText];
}

- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<ABI5_0_0RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  parentProperties = [super processUpdatedProperties:applierBlocks
                                    parentProperties:parentProperties];

  UIEdgeInsets padding = self.paddingAsInsets;
  CGFloat width = self.frame.size.width - (padding.left + padding.right);

  NSTextStorage *textStorage = [self buildTextStorageForWidth:width widthMode:CSS_MEASURE_MODE_EXACTLY];
  [applierBlocks addObject:^(NSDictionary<NSNumber *, ABI5_0_0RCTText *> *viewRegistry) {
    ABI5_0_0RCTText *view = viewRegistry[self.ReactABI5_0_0Tag];
    view.textStorage = textStorage;
  }];

  return parentProperties;
}

- (void)applyLayoutNode:(css_node_t *)node
      viewsWithNewFrame:(NSMutableSet<ABI5_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  [super applyLayoutNode:node viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
  [self dirtyPropagation];
}

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(css_measure_mode_t)widthMode
{
  if (_cachedTextStorage && width == _cachedTextStorageWidth) {
    return _cachedTextStorage;
  }

  NSLayoutManager *layoutManager = [NSLayoutManager new];

  NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:self.attributedString];
  [textStorage addLayoutManager:layoutManager];

  NSTextContainer *textContainer = [NSTextContainer new];
  textContainer.lineFragmentPadding = 0.0;
  textContainer.lineBreakMode = _numberOfLines > 0 ? NSLineBreakByTruncatingTail : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = _numberOfLines;
  textContainer.size = (CGSize){widthMode == CSS_MEASURE_MODE_UNDEFINED ? CGFLOAT_MAX : width, CGFLOAT_MAX};

  [layoutManager addTextContainer:textContainer];
  [layoutManager ensureLayoutForTextContainer:textContainer];

  _cachedTextStorageWidth = width;
  _cachedTextStorage = textStorage;

  return textStorage;
}

- (void)dirtyText
{
  [super dirtyText];
  _cachedTextStorage = nil;
}

- (void)recomputeText
{
  [self attributedString];
  [self setTextComputed];
  [self dirtyPropagation];
}

- (NSAttributedString *)attributedString
{
  return [self _attributedStringWithFontFamily:nil
                                      fontSize:nil
                                    fontWeight:nil
                                     fontStyle:nil
                                 letterSpacing:nil
                            useBackgroundColor:NO
                               foregroundColor:self.color ?: [UIColor blackColor]
                               backgroundColor:self.backgroundColor
                                       opacity:self.opacity];
}

- (NSAttributedString *)_attributedStringWithFontFamily:(NSString *)fontFamily
                                               fontSize:(NSNumber *)fontSize
                                             fontWeight:(NSString *)fontWeight
                                              fontStyle:(NSString *)fontStyle
                                          letterSpacing:(NSNumber *)letterSpacing
                                     useBackgroundColor:(BOOL)useBackgroundColor
                                        foregroundColor:(UIColor *)foregroundColor
                                        backgroundColor:(UIColor *)backgroundColor
                                                opacity:(CGFloat)opacity
{
  if (![self isTextDirty] && _cachedAttributedString) {
    return _cachedAttributedString;
  }

  if (_fontSize && !isnan(_fontSize)) {
    fontSize = @(_fontSize);
  }
  if (_fontWeight) {
    fontWeight = _fontWeight;
  }
  if (_fontStyle) {
    fontStyle = _fontStyle;
  }
  if (_fontFamily) {
    fontFamily = _fontFamily;
  }
  if (!isnan(_letterSpacing)) {
    letterSpacing = @(_letterSpacing);
  }

  _effectiveLetterSpacing = letterSpacing.doubleValue;

  NSMutableAttributedString *attributedString = [NSMutableAttributedString new];
  for (ABI5_0_0RCTShadowView *child in [self ReactABI5_0_0Subviews]) {
    if ([child isKindOfClass:[ABI5_0_0RCTShadowText class]]) {
      ABI5_0_0RCTShadowText *shadowText = (ABI5_0_0RCTShadowText *)child;
      [attributedString appendAttributedString:
        [shadowText _attributedStringWithFontFamily:fontFamily
                                           fontSize:fontSize
                                         fontWeight:fontWeight
                                          fontStyle:fontStyle
                                      letterSpacing:letterSpacing
                                 useBackgroundColor:YES
                                    foregroundColor:shadowText.color ?: foregroundColor
                                    backgroundColor:shadowText.backgroundColor ?: backgroundColor
                                            opacity:opacity * shadowText.opacity]];
    } else if ([child isKindOfClass:[ABI5_0_0RCTShadowRawText class]]) {
      ABI5_0_0RCTShadowRawText *shadowRawText = (ABI5_0_0RCTShadowRawText *)child;
      [attributedString appendAttributedString:[[NSAttributedString alloc] initWithString:shadowRawText.text ?: @""]];
    } else if ([child conformsToProtocol:@protocol(ABI5_0_0RCTImageComponent)]) {
      UIImage *image = ((id<ABI5_0_0RCTImageComponent>)child).image;
      if (image) {
        NSTextAttachment *imageAttachment = [NSTextAttachment new];
        imageAttachment.image = image;
        [attributedString appendAttributedString:[NSAttributedString attributedStringWithAttachment:imageAttachment]];
      }
    } else {
      ABI5_0_0RCTLogError(@"<Text> can't have any children except <Text>, <Image> or raw strings");
    }

    [child setTextComputed];
  }

  [self _addAttribute:NSForegroundColorAttributeName
            withValue:[foregroundColor colorWithAlphaComponent:CGColorGetAlpha(foregroundColor.CGColor) * opacity]
   toAttributedString:attributedString];

  if (_isHighlighted) {
    [self _addAttribute:ABI5_0_0RCTIsHighlightedAttributeName withValue:@YES toAttributedString:attributedString];
  }
  if (useBackgroundColor && backgroundColor) {
    [self _addAttribute:NSBackgroundColorAttributeName
              withValue:[backgroundColor colorWithAlphaComponent:CGColorGetAlpha(backgroundColor.CGColor) * opacity]
     toAttributedString:attributedString];
  }

  UIFont *font = [ABI5_0_0RCTConvert UIFont:nil withFamily:fontFamily
                               size:fontSize weight:fontWeight style:fontStyle
                    scaleMultiplier:(_allowFontScaling && _fontSizeMultiplier > 0.0 ? _fontSizeMultiplier : 1.0)];
  [self _addAttribute:NSFontAttributeName withValue:font toAttributedString:attributedString];
  [self _addAttribute:NSKernAttributeName withValue:letterSpacing toAttributedString:attributedString];
  [self _addAttribute:ABI5_0_0RCTReactABI5_0_0TagAttributeName withValue:self.ReactABI5_0_0Tag toAttributedString:attributedString];
  [self _setParagraphStyleOnAttributedString:attributedString];

  // create a non-mutable attributedString for use by the Text system which avoids copies down the line
  _cachedAttributedString = [[NSAttributedString alloc] initWithAttributedString:attributedString];
  [self dirtyLayout];

  return _cachedAttributedString;
}

- (void)_addAttribute:(NSString *)attribute withValue:(id)attributeValue toAttributedString:(NSMutableAttributedString *)attributedString
{
  [attributedString enumerateAttribute:attribute inRange:NSMakeRange(0, attributedString.length) options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
    if (!value && attributeValue) {
      [attributedString addAttribute:attribute value:attributeValue range:range];
    }
  }];
}

/*
 * LineHeight works the same way line-height works in the web: if children and self have
 * varying lineHeights, we simply take the max.
 */
- (void)_setParagraphStyleOnAttributedString:(NSMutableAttributedString *)attributedString
{
  // check if we have lineHeight set on self
  __block BOOL hasParagraphStyle = NO;
  if (_lineHeight || _textAlign) {
    hasParagraphStyle = YES;
  }

  if (!_lineHeight) {
    self.lineHeight = 0.0;
  }

  // check for lineHeight on each of our children, update the max as we go (in self.lineHeight)
  [attributedString enumerateAttribute:NSParagraphStyleAttributeName inRange:(NSRange){0, attributedString.length} options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
    if (value) {
      NSParagraphStyle *paragraphStyle = (NSParagraphStyle *)value;
      CGFloat maximumLineHeight = round(paragraphStyle.maximumLineHeight / self.fontSizeMultiplier);
      if (maximumLineHeight > self.lineHeight) {
        self.lineHeight = maximumLineHeight;
      }
      hasParagraphStyle = YES;
    }
  }];

  self.textAlign = _textAlign ?: NSTextAlignmentNatural;
  self.writingDirection = _writingDirection ?: NSWritingDirectionNatural;

  // if we found anything, set it :D
  if (hasParagraphStyle) {
    NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
    paragraphStyle.alignment = _textAlign;
    paragraphStyle.baseWritingDirection = _writingDirection;
    CGFloat lineHeight = round(_lineHeight * (_allowFontScaling && self.fontSizeMultiplier > 0.0 ? self.fontSizeMultiplier : 1.0));
    paragraphStyle.minimumLineHeight = lineHeight;
    paragraphStyle.maximumLineHeight = lineHeight;
    [attributedString addAttribute:NSParagraphStyleAttributeName
                             value:paragraphStyle
                             range:(NSRange){0, attributedString.length}];
  }

  // Text decoration
  if (_textDecorationLine == ABI5_0_0RCTTextDecorationLineTypeUnderline ||
      _textDecorationLine == ABI5_0_0RCTTextDecorationLineTypeUnderlineStrikethrough) {
    [self _addAttribute:NSUnderlineStyleAttributeName withValue:@(_textDecorationStyle)
     toAttributedString:attributedString];
  }
  if (_textDecorationLine == ABI5_0_0RCTTextDecorationLineTypeStrikethrough ||
      _textDecorationLine == ABI5_0_0RCTTextDecorationLineTypeUnderlineStrikethrough){
    [self _addAttribute:NSStrikethroughStyleAttributeName withValue:@(_textDecorationStyle)
     toAttributedString:attributedString];
  }
  if (_textDecorationColor) {
    [self _addAttribute:NSStrikethroughColorAttributeName withValue:_textDecorationColor
     toAttributedString:attributedString];
    [self _addAttribute:NSUnderlineColorAttributeName withValue:_textDecorationColor
     toAttributedString:attributedString];
  }

  // Text shadow
  if (!CGSizeEqualToSize(_textShadowOffset, CGSizeZero)) {
    NSShadow *shadow = [NSShadow new];
    shadow.shadowOffset = _textShadowOffset;
    shadow.shadowBlurRadius = _textShadowRadius;
    shadow.shadowColor = _textShadowColor;
    [self _addAttribute:NSShadowAttributeName withValue:shadow toAttributedString:attributedString];
  }
}

- (void)fillCSSNode:(css_node_t *)node
{
  [super fillCSSNode:node];
  node->measure = ABI5_0_0RCTMeasure;
  node->children_count = 0;
}

- (void)insertReactABI5_0_0Subview:(ABI5_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI5_0_0Subview:subview atIndex:atIndex];
  self.cssNode->children_count = 0;
}

- (void)removeReactABI5_0_0Subview:(ABI5_0_0RCTShadowView *)subview
{
  [super removeReactABI5_0_0Subview:subview];
  self.cssNode->children_count = 0;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  super.backgroundColor = backgroundColor;
  [self dirtyText];
}

#define ABI5_0_0RCT_TEXT_PROPERTY(setProp, ivar, type) \
- (void)set##setProp:(type)value;              \
{                                              \
  ivar = value;                                \
  [self dirtyText];                            \
}

ABI5_0_0RCT_TEXT_PROPERTY(Color, _color, UIColor *)
ABI5_0_0RCT_TEXT_PROPERTY(FontFamily, _fontFamily, NSString *)
ABI5_0_0RCT_TEXT_PROPERTY(FontSize, _fontSize, CGFloat)
ABI5_0_0RCT_TEXT_PROPERTY(FontWeight, _fontWeight, NSString *)
ABI5_0_0RCT_TEXT_PROPERTY(FontStyle, _fontStyle, NSString *)
ABI5_0_0RCT_TEXT_PROPERTY(IsHighlighted, _isHighlighted, BOOL)
ABI5_0_0RCT_TEXT_PROPERTY(LetterSpacing, _letterSpacing, CGFloat)
ABI5_0_0RCT_TEXT_PROPERTY(LineHeight, _lineHeight, CGFloat)
ABI5_0_0RCT_TEXT_PROPERTY(NumberOfLines, _numberOfLines, NSUInteger)
ABI5_0_0RCT_TEXT_PROPERTY(TextAlign, _textAlign, NSTextAlignment)
ABI5_0_0RCT_TEXT_PROPERTY(TextDecorationColor, _textDecorationColor, UIColor *);
ABI5_0_0RCT_TEXT_PROPERTY(TextDecorationLine, _textDecorationLine, ABI5_0_0RCTTextDecorationLineType);
ABI5_0_0RCT_TEXT_PROPERTY(TextDecorationStyle, _textDecorationStyle, NSUnderlineStyle);
ABI5_0_0RCT_TEXT_PROPERTY(WritingDirection, _writingDirection, NSWritingDirection)
ABI5_0_0RCT_TEXT_PROPERTY(Opacity, _opacity, CGFloat)
ABI5_0_0RCT_TEXT_PROPERTY(TextShadowOffset, _textShadowOffset, CGSize);
ABI5_0_0RCT_TEXT_PROPERTY(TextShadowRadius, _textShadowRadius, CGFloat);
ABI5_0_0RCT_TEXT_PROPERTY(TextShadowColor, _textShadowColor, UIColor *);

- (void)setAllowFontScaling:(BOOL)allowFontScaling
{
  _allowFontScaling = allowFontScaling;
  for (ABI5_0_0RCTShadowView *child in [self ReactABI5_0_0Subviews]) {
    if ([child isKindOfClass:[ABI5_0_0RCTShadowText class]]) {
      ((ABI5_0_0RCTShadowText *)child).allowFontScaling = allowFontScaling;
    }
  }
  [self dirtyText];
}

- (void)setFontSizeMultiplier:(CGFloat)fontSizeMultiplier
{
  _fontSizeMultiplier = fontSizeMultiplier;
  for (ABI5_0_0RCTShadowView *child in [self ReactABI5_0_0Subviews]) {
    if ([child isKindOfClass:[ABI5_0_0RCTShadowText class]]) {
      ((ABI5_0_0RCTShadowText *)child).fontSizeMultiplier = fontSizeMultiplier;
    }
  }
  [self dirtyText];
}

@end
