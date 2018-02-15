/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTTextShadowView.h"

#import <ReactABI26_0_0/ABI26_0_0RCTAccessibilityManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTFont.h>
#import <ReactABI26_0_0/ABI26_0_0RCTLog.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUtils.h>

#import "ABI26_0_0RCTRawTextShadowView.h"
#import "ABI26_0_0RCTTextView.h"
#import "ABI26_0_0RCTMultilineTextInputView.h"

NSString *const ABI26_0_0RCTIsHighlightedAttributeName = @"IsHighlightedAttributeName";
NSString *const ABI26_0_0RCTReactABI26_0_0TagAttributeName = @"ReactABI26_0_0TagAttributeName";

static NSString *const kShadowViewAttributeName = @"ABI26_0_0RCTShadowViewAttributeName";

static CGFloat const kAutoSizeWidthErrorMargin  = 0.05f;
static CGFloat const kAutoSizeHeightErrorMargin = 0.025f;
static CGFloat const kAutoSizeGranularity       = 0.001f;

@implementation ABI26_0_0RCTTextShadowView
{
  NSTextStorage *_cachedTextStorage;
  CGFloat _cachedTextStorageWidth;
  CGFloat _cachedTextStorageWidthMode;
  NSAttributedString *_cachedAttributedString;
  CGFloat _effectiveLetterSpacing;
  UIUserInterfaceLayoutDirection _cachedLayoutDirection;
}

static ABI26_0_0YGSize ABI26_0_0RCTMeasure(ABI26_0_0YGNodeRef node, float width, ABI26_0_0YGMeasureMode widthMode, float height, ABI26_0_0YGMeasureMode heightMode)
{
  ABI26_0_0RCTTextShadowView *shadowText = (__bridge ABI26_0_0RCTTextShadowView *)ABI26_0_0YGNodeGetContext(node);
  NSTextStorage *textStorage = [shadowText buildTextStorageForWidth:width widthMode:widthMode];
  [shadowText calculateTextFrame:textStorage];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  CGSize computedSize = [layoutManager usedRectForTextContainer:textContainer].size;

  ABI26_0_0YGSize result;
  result.width = ABI26_0_0RCTCeilPixelValue(computedSize.width);
  if (shadowText->_effectiveLetterSpacing < 0) {
    result.width -= shadowText->_effectiveLetterSpacing;
  }
  result.height = ABI26_0_0RCTCeilPixelValue(computedSize.height);
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
    _cachedTextStorageWidth = -1;
    _cachedTextStorageWidthMode = -1;
    _fontSizeMultiplier = 1.0;
    _textAlign = NSTextAlignmentNatural;
    _writingDirection = NSWritingDirectionNatural;
    _cachedLayoutDirection = UIUserInterfaceLayoutDirectionLeftToRight;

     ABI26_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI26_0_0RCTMeasure);

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(contentSizeMultiplierDidChange:)
                                                 name:ABI26_0_0RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
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

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (void)contentSizeMultiplierDidChange:(NSNotification *)note
{
  ABI26_0_0YGNodeMarkDirty(self.yogaNode);
  [self dirtyText];
}

- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<ABI26_0_0RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties
{
  if ([[self ReactABI26_0_0Superview] isKindOfClass:[ABI26_0_0RCTTextShadowView class]]) {
    return parentProperties;
  }

  parentProperties = [super processUpdatedProperties:applierBlocks
                                    parentProperties:parentProperties];

  CGFloat availableWidth = self.availableSize.width;
  NSNumber *parentTag = [[self ReactABI26_0_0Superview] ReactABI26_0_0Tag];
  NSTextStorage *textStorage = [self buildTextStorageForWidth:availableWidth widthMode:ABI26_0_0YGMeasureModeExactly];
  CGRect textFrame = [self calculateTextFrame:textStorage];
  BOOL selectable = _selectable;
  [applierBlocks addObject:^(NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI26_0_0RCTTextView *view = (ABI26_0_0RCTTextView *)viewRegistry[self.ReactABI26_0_0Tag];
    view.textFrame = textFrame;
    view.textStorage = textStorage;
    view.selectable = selectable;

    /**
     * NOTE: this logic is included to support rich text editing inside multiline
     * `<TextInput>` controls. It is required in order to ensure that the
     * textStorage (aka attributed string) is copied over from the ABI26_0_0RCTTextShadowView
     * to the ABI26_0_0RCTTextView view in time to be used to update the editable text content.
     * TODO: we should establish a delegate relationship betweeen ABI26_0_0RCTMultilineTextInputView
     * and its contaned ABI26_0_0RCTTextView element when they get inserted and get rid of this
     */
    UIView *parentView = viewRegistry[parentTag];
    if ([parentView respondsToSelector:@selector(performTextUpdate)]) {
      [(ABI26_0_0RCTMultilineTextInputView *)parentView performTextUpdate];
    }
  }];

  return parentProperties;
}

- (void)applyLayoutNode:(ABI26_0_0YGNodeRef)node
      viewsWithNewFrame:(NSMutableSet<ABI26_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  [super applyLayoutNode:node viewsWithNewFrame:viewsWithNewFrame absolutePosition:absolutePosition];
  [self dirtyPropagation];
}

- (void)applyLayoutToChildren:(ABI26_0_0YGNodeRef)node
            viewsWithNewFrame:(NSMutableSet<ABI26_0_0RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition
{
  // Run layout on subviews.
  CGFloat availableWidth = self.availableSize.width;
  NSTextStorage *textStorage = [self buildTextStorageForWidth:availableWidth widthMode:ABI26_0_0YGMeasureModeExactly];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];
  [layoutManager.textStorage enumerateAttribute:kShadowViewAttributeName inRange:characterRange options:0 usingBlock:^(ABI26_0_0RCTShadowView *child, NSRange range, BOOL *_) {
    if (child) {
      ABI26_0_0YGNodeRef childNode = child.yogaNode;
      float width = ABI26_0_0YGNodeStyleGetWidth(childNode).value;
      float height = ABI26_0_0YGNodeStyleGetHeight(childNode).value;
      if (ABI26_0_0YGFloatIsUndefined(width) || ABI26_0_0YGFloatIsUndefined(height)) {
        ABI26_0_0RCTLogError(@"Views nested within a <Text> must have a width and height");
      }
      UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:range.location effectiveRange:nil];
      CGRect glyphRect = [layoutManager boundingRectForGlyphRange:range inTextContainer:textContainer];
      CGRect childFrame = {{
        ABI26_0_0RCTRoundPixelValue(glyphRect.origin.x),
        ABI26_0_0RCTRoundPixelValue(glyphRect.origin.y + glyphRect.size.height - height + font.descender)
      }, {
        ABI26_0_0RCTRoundPixelValue(width),
        ABI26_0_0RCTRoundPixelValue(height)
      }};

      NSRange truncatedGlyphRange = [layoutManager truncatedGlyphRangeInLineFragmentForGlyphAtIndex:range.location];
      BOOL childIsTruncated = NSIntersectionRange(range, truncatedGlyphRange).length != 0;

      [child collectUpdatedFrames:viewsWithNewFrame
                        withFrame:childFrame
                           hidden:childIsTruncated
                 absolutePosition:absolutePosition];
    }
  }];
}

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI26_0_0YGMeasureMode)widthMode
{
  if (
      _cachedTextStorage &&
      (width == _cachedTextStorageWidth || (isnan(width) && isnan(_cachedTextStorageWidth))) &&
      widthMode == _cachedTextStorageWidthMode &&
      _cachedLayoutDirection == self.layoutDirection
  ) {
    return _cachedTextStorage;
  }

  NSLayoutManager *layoutManager = [NSLayoutManager new];

  NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:self.attributedString];
  [textStorage addLayoutManager:layoutManager];

  NSTextContainer *textContainer = [NSTextContainer new];
  textContainer.lineFragmentPadding = 0.0;

  if (_numberOfLines > 0) {
    textContainer.lineBreakMode = _ellipsizeMode;
  } else {
    textContainer.lineBreakMode = NSLineBreakByClipping;
  }

  textContainer.maximumNumberOfLines = _numberOfLines;
  textContainer.size = (CGSize){
    widthMode == ABI26_0_0YGMeasureModeUndefined || isnan(width) ? CGFLOAT_MAX : width,
    CGFLOAT_MAX
  };

  [layoutManager addTextContainer:textContainer];
  [layoutManager ensureLayoutForTextContainer:textContainer];

  _cachedTextStorageWidth = width;
  _cachedTextStorageWidthMode = widthMode;
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
  if (
      ![self isTextDirty] &&
      _cachedAttributedString &&
      _cachedLayoutDirection == self.layoutDirection
  ) {
    return _cachedAttributedString;
  }

  _cachedLayoutDirection = self.layoutDirection;

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

  UIFont *font = [ABI26_0_0RCTFont updateFont:nil
                          withFamily:fontFamily
                                size:fontSize
                              weight:fontWeight
                               style:fontStyle
                             variant:_fontVariant
                     scaleMultiplier:_allowFontScaling ? _fontSizeMultiplier : 1.0];

  CGFloat heightOfTallestSubview = 0.0;
  NSMutableAttributedString *attributedString = [NSMutableAttributedString new];
  for (ABI26_0_0RCTShadowView *child in [self ReactABI26_0_0Subviews]) {
    if ([child isKindOfClass:[ABI26_0_0RCTTextShadowView class]]) {
      ABI26_0_0RCTTextShadowView *shadowText = (ABI26_0_0RCTTextShadowView *)child;
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
      [child setTextComputed];
    } else if ([child isKindOfClass:[ABI26_0_0RCTRawTextShadowView class]]) {
      ABI26_0_0RCTRawTextShadowView *shadowRawText = (ABI26_0_0RCTRawTextShadowView *)child;
      [attributedString appendAttributedString:[[NSAttributedString alloc] initWithString:shadowRawText.text ?: @""]];
      [child setTextComputed];
    } else {
      float width = ABI26_0_0YGNodeStyleGetWidth(child.yogaNode).value;
      float height = ABI26_0_0YGNodeStyleGetHeight(child.yogaNode).value;
      if (ABI26_0_0YGFloatIsUndefined(width) || ABI26_0_0YGFloatIsUndefined(height)) {
        ABI26_0_0RCTLogError(@"Views nested within a <Text> must have a width and height");
      }
      NSTextAttachment *attachment = [NSTextAttachment new];
      attachment.bounds = (CGRect){CGPointZero, {width, height}};
      NSMutableAttributedString *attachmentString = [NSMutableAttributedString new];
      [attachmentString appendAttributedString:[NSAttributedString attributedStringWithAttachment:attachment]];
      [attachmentString addAttribute:kShadowViewAttributeName value:child range:(NSRange){0, attachmentString.length}];
      [attributedString appendAttributedString:attachmentString];
      if (height > heightOfTallestSubview) {
        heightOfTallestSubview = height;
      }
      // Don't call setTextComputed on this child. ABI26_0_0RCTTextViewManager takes care of
      // processing inline UIViews.
    }
  }

  [self _addAttribute:NSForegroundColorAttributeName
            withValue:[foregroundColor colorWithAlphaComponent:CGColorGetAlpha(foregroundColor.CGColor) * opacity]
   toAttributedString:attributedString];

  if (_isHighlighted) {
    [self _addAttribute:ABI26_0_0RCTIsHighlightedAttributeName withValue:@YES toAttributedString:attributedString];
  }
  if (useBackgroundColor && backgroundColor) {
    [self _addAttribute:NSBackgroundColorAttributeName
              withValue:[backgroundColor colorWithAlphaComponent:CGColorGetAlpha(backgroundColor.CGColor) * opacity]
     toAttributedString:attributedString];
  }

  [self _addAttribute:NSFontAttributeName withValue:font toAttributedString:attributedString];
  [self _addAttribute:NSKernAttributeName withValue:letterSpacing toAttributedString:attributedString];
  [self _addAttribute:ABI26_0_0RCTReactABI26_0_0TagAttributeName withValue:self.ReactABI26_0_0Tag toAttributedString:attributedString];
  [self _setParagraphStyleOnAttributedString:attributedString
                              fontLineHeight:font.lineHeight
                      heightOfTallestSubview:heightOfTallestSubview];

  // create a non-mutable attributedString for use by the Text system which avoids copies down the line
  _cachedAttributedString = [[NSAttributedString alloc] initWithAttributedString:attributedString];
  ABI26_0_0YGNodeMarkDirty(self.yogaNode);

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
                              fontLineHeight:(CGFloat)fontLineHeight
                      heightOfTallestSubview:(CGFloat)heightOfTallestSubview
{
  __block BOOL hasParagraphStyle = NO;

  if (_lineHeight != 0.0 || _textAlign != NSTextAlignmentNatural) {
    hasParagraphStyle = YES;
  }

  CGFloat fontSizeMultiplier = _allowFontScaling ? _fontSizeMultiplier : 1.0;

  // Text line height
  __block float compoundLineHeight = _lineHeight * fontSizeMultiplier;

  // Checking for `maximumLineHeight` on each of our children and updating `compoundLineHeight` with the maximum value on the go.
  [attributedString enumerateAttribute:NSParagraphStyleAttributeName
                               inRange:(NSRange){0, attributedString.length}
                               options:0
                            usingBlock:^(NSParagraphStyle *paragraphStyle, NSRange range, BOOL *stop) {

    if (!paragraphStyle) {
      return;
    }

    hasParagraphStyle = YES;
    compoundLineHeight = MAX(compoundLineHeight, paragraphStyle.maximumLineHeight);
  }];

  compoundLineHeight = MAX(round(compoundLineHeight), ceilf(heightOfTallestSubview));

  // Text alignment
  NSTextAlignment textAlign = _textAlign;
  if (textAlign == NSTextAlignmentRight || textAlign == NSTextAlignmentLeft) {
    if (_cachedLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft) {
      if (textAlign == NSTextAlignmentRight) {
        textAlign = NSTextAlignmentLeft;
      } else {
        textAlign = NSTextAlignmentRight;
      }
    }
  }

  if (hasParagraphStyle) {
    NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
    paragraphStyle.alignment = textAlign;
    paragraphStyle.baseWritingDirection = _writingDirection;
    paragraphStyle.minimumLineHeight = compoundLineHeight;
    paragraphStyle.maximumLineHeight = compoundLineHeight;
    [attributedString addAttribute:NSParagraphStyleAttributeName
                             value:paragraphStyle
                             range:(NSRange){0, attributedString.length}];

    if (compoundLineHeight > fontLineHeight) {
      [attributedString addAttribute:NSBaselineOffsetAttributeName
                               value:@(compoundLineHeight / 2 - fontLineHeight / 2)
                               range:(NSRange){0, attributedString.length}];
    }
  }

  // Text decoration
  if (_textDecorationLine == ABI26_0_0RCTTextDecorationLineTypeUnderline ||
      _textDecorationLine == ABI26_0_0RCTTextDecorationLineTypeUnderlineStrikethrough) {
    [self _addAttribute:NSUnderlineStyleAttributeName withValue:@(_textDecorationStyle)
     toAttributedString:attributedString];
  }
  if (_textDecorationLine == ABI26_0_0RCTTextDecorationLineTypeStrikethrough ||
      _textDecorationLine == ABI26_0_0RCTTextDecorationLineTypeUnderlineStrikethrough){
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

#pragma mark Autosizing

- (CGRect)calculateTextFrame:(NSTextStorage *)textStorage
{
  CGRect textFrame = UIEdgeInsetsInsetRect((CGRect){CGPointZero, self.frame.size},
                                           self.compoundInsets);

  if (_adjustsFontSizeToFit) {
    textFrame = [self updateStorage:textStorage toFitFrame:textFrame];
  }

  return textFrame;
}

- (CGRect)updateStorage:(NSTextStorage *)textStorage toFitFrame:(CGRect)frame
{
  BOOL fits = [self attemptScale:1.0f
                       inStorage:textStorage
                        forFrame:frame];
  CGSize requiredSize;
  if (!fits) {
    requiredSize = [self calculateOptimumScaleInFrame:frame
                                           forStorage:textStorage
                                             minScale:self.minimumFontScale
                                             maxScale:1.0
                                              prevMid:INT_MAX];
  } else {
    requiredSize = [self calculateSize:textStorage];
  }

  // Vertically center draw position for new text sizing.
  frame.origin.y = self.compoundInsets.top + ABI26_0_0RCTRoundPixelValue((CGRectGetHeight(frame) - requiredSize.height) / 2.0f);
  return frame;
}

- (CGSize)calculateOptimumScaleInFrame:(CGRect)frame
                            forStorage:(NSTextStorage *)textStorage
                              minScale:(CGFloat)minScale
                              maxScale:(CGFloat)maxScale
                               prevMid:(CGFloat)prevMid
{
  CGFloat midScale = (minScale + maxScale) / 2.0f;
  if (round((prevMid / kAutoSizeGranularity)) == round((midScale / kAutoSizeGranularity))) {
    //Bail because we can't meet error margin.
    return [self calculateSize:textStorage];
  } else {
    ABI26_0_0RCTSizeComparison comparison = [self attemptScale:midScale
                                            inStorage:textStorage
                                             forFrame:frame];
    if (comparison == ABI26_0_0RCTSizeWithinRange) {
      return [self calculateSize:textStorage];
    } else if (comparison == ABI26_0_0RCTSizeTooLarge) {
      return [self calculateOptimumScaleInFrame:frame
                                     forStorage:textStorage
                                       minScale:minScale
                                       maxScale:midScale - kAutoSizeGranularity
                                        prevMid:midScale];
    } else {
      return [self calculateOptimumScaleInFrame:frame
                                     forStorage:textStorage
                                       minScale:midScale + kAutoSizeGranularity
                                       maxScale:maxScale
                                        prevMid:midScale];
    }
  }
}

- (ABI26_0_0RCTSizeComparison)attemptScale:(CGFloat)scale
                        inStorage:(NSTextStorage *)textStorage
                         forFrame:(CGRect)frame
{
  NSLayoutManager *layoutManager = [textStorage.layoutManagers firstObject];
  NSTextContainer *textContainer = [layoutManager.textContainers firstObject];

  NSRange glyphRange = NSMakeRange(0, textStorage.length);
  [textStorage beginEditing];
  [textStorage enumerateAttribute:NSFontAttributeName
                           inRange:glyphRange
                           options:0
                        usingBlock:^(UIFont *font, NSRange range, BOOL *stop)
   {
     if (font) {
       UIFont *originalFont = [self.attributedString attribute:NSFontAttributeName
                                                       atIndex:range.location
                                                effectiveRange:&range];
       UIFont *newFont = [font fontWithSize:originalFont.pointSize * scale];
       if (newFont) {
         [textStorage removeAttribute:NSFontAttributeName range:range];
         [textStorage addAttribute:NSFontAttributeName value:newFont range:range];
       } else {
         ABI26_0_0RCTLogError(@"Font '%@' doesn't support automatic scaling.", originalFont.familyName);
         *stop = YES;
       }
     }
   }];

  [textStorage endEditing];

  NSInteger linesRequired = [self numberOfLinesRequired:[textStorage.layoutManagers firstObject]];
  CGSize requiredSize = [self calculateSize:textStorage];

  BOOL fitSize = requiredSize.height <= CGRectGetHeight(frame) &&
  requiredSize.width <= CGRectGetWidth(frame);

  BOOL fitLines = linesRequired <= textContainer.maximumNumberOfLines ||
  textContainer.maximumNumberOfLines == 0;

  if (fitLines && fitSize) {
    if ((requiredSize.width + (CGRectGetWidth(frame) * kAutoSizeWidthErrorMargin)) > CGRectGetWidth(frame) &&
        (requiredSize.height + (CGRectGetHeight(frame) * kAutoSizeHeightErrorMargin)) > CGRectGetHeight(frame))
    {
      return ABI26_0_0RCTSizeWithinRange;
    } else {
      return ABI26_0_0RCTSizeTooSmall;
    }
  } else {
    return ABI26_0_0RCTSizeTooLarge;
  }
}

// Via Apple Text Layout Programming Guide
// https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/TextLayout/Tasks/CountLines.html
- (NSInteger)numberOfLinesRequired:(NSLayoutManager *)layoutManager
{
  NSInteger numberOfLines, index, numberOfGlyphs = [layoutManager numberOfGlyphs];
  NSRange lineRange;
  for (numberOfLines = 0, index = 0; index < numberOfGlyphs; numberOfLines++){
    (void) [layoutManager lineFragmentRectForGlyphAtIndex:index
                                           effectiveRange:&lineRange];
    index = NSMaxRange(lineRange);
  }

  return numberOfLines;
}

// Via Apple Text Layout Programming Guide
//https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/TextLayout/Tasks/StringHeight.html
- (CGSize)calculateSize:(NSTextStorage *)storage
{
  NSLayoutManager *layoutManager = [storage.layoutManagers firstObject];
  NSTextContainer *textContainer = [layoutManager.textContainers firstObject];

  [textContainer setLineBreakMode:NSLineBreakByWordWrapping];
  NSInteger maxLines = [textContainer maximumNumberOfLines];
  [textContainer setMaximumNumberOfLines:0];
  (void) [layoutManager glyphRangeForTextContainer:textContainer];
  CGSize requiredSize = [layoutManager usedRectForTextContainer:textContainer].size;
  [textContainer setMaximumNumberOfLines:maxLines];

  return requiredSize;
}

#define ABI26_0_0RCT_TEXT_PROPERTY(setProp, ivar, type) \
- (void)set##setProp:(type)value;              \
{                                              \
  ivar = value;                                \
  [self dirtyText];                            \
}

ABI26_0_0RCT_TEXT_PROPERTY(AdjustsFontSizeToFit, _adjustsFontSizeToFit, BOOL)
ABI26_0_0RCT_TEXT_PROPERTY(Color, _color, UIColor *)
ABI26_0_0RCT_TEXT_PROPERTY(FontFamily, _fontFamily, NSString *)
ABI26_0_0RCT_TEXT_PROPERTY(FontSize, _fontSize, CGFloat)
ABI26_0_0RCT_TEXT_PROPERTY(FontWeight, _fontWeight, NSString *)
ABI26_0_0RCT_TEXT_PROPERTY(FontStyle, _fontStyle, NSString *)
ABI26_0_0RCT_TEXT_PROPERTY(FontVariant, _fontVariant, NSArray *)
ABI26_0_0RCT_TEXT_PROPERTY(IsHighlighted, _isHighlighted, BOOL)
ABI26_0_0RCT_TEXT_PROPERTY(LetterSpacing, _letterSpacing, CGFloat)
ABI26_0_0RCT_TEXT_PROPERTY(LineHeight, _lineHeight, CGFloat)
ABI26_0_0RCT_TEXT_PROPERTY(NumberOfLines, _numberOfLines, NSUInteger)
ABI26_0_0RCT_TEXT_PROPERTY(EllipsizeMode, _ellipsizeMode, NSLineBreakMode)
ABI26_0_0RCT_TEXT_PROPERTY(TextAlign, _textAlign, NSTextAlignment)
ABI26_0_0RCT_TEXT_PROPERTY(TextDecorationColor, _textDecorationColor, UIColor *);
ABI26_0_0RCT_TEXT_PROPERTY(TextDecorationLine, _textDecorationLine, ABI26_0_0RCTTextDecorationLineType);
ABI26_0_0RCT_TEXT_PROPERTY(TextDecorationStyle, _textDecorationStyle, NSUnderlineStyle);
ABI26_0_0RCT_TEXT_PROPERTY(WritingDirection, _writingDirection, NSWritingDirection)
ABI26_0_0RCT_TEXT_PROPERTY(Opacity, _opacity, CGFloat)
ABI26_0_0RCT_TEXT_PROPERTY(TextShadowOffset, _textShadowOffset, CGSize);
ABI26_0_0RCT_TEXT_PROPERTY(TextShadowRadius, _textShadowRadius, CGFloat);
ABI26_0_0RCT_TEXT_PROPERTY(TextShadowColor, _textShadowColor, UIColor *);

- (void)setAllowFontScaling:(BOOL)allowFontScaling
{
  _allowFontScaling = allowFontScaling;
  for (ABI26_0_0RCTShadowView *child in [self ReactABI26_0_0Subviews]) {
    if ([child isKindOfClass:[ABI26_0_0RCTTextShadowView class]]) {
      ((ABI26_0_0RCTTextShadowView *)child).allowFontScaling = allowFontScaling;
    }
  }
  [self dirtyText];
}

- (void)setFontSizeMultiplier:(CGFloat)fontSizeMultiplier
{
  _fontSizeMultiplier = fontSizeMultiplier;
  if (_fontSizeMultiplier == 0) {
    ABI26_0_0RCTLogError(@"fontSizeMultiplier value must be > zero.");
    _fontSizeMultiplier = 1.0;
  }
  for (ABI26_0_0RCTShadowView *child in [self ReactABI26_0_0Subviews]) {
    if ([child isKindOfClass:[ABI26_0_0RCTTextShadowView class]]) {
      ((ABI26_0_0RCTTextShadowView *)child).fontSizeMultiplier = fontSizeMultiplier;
    }
  }
  [self dirtyText];
}

- (void)setMinimumFontScale:(CGFloat)minimumFontScale
{
  if (minimumFontScale >= 0.01) {
    _minimumFontScale = minimumFontScale;
  }
  [self dirtyText];
}

@end
