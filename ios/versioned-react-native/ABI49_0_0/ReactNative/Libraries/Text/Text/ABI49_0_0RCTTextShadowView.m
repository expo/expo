/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTTextShadowView.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTShadowView+Layout.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0yoga/ABI49_0_0Yoga.h>

#import <ABI49_0_0React/ABI49_0_0RCTTextView.h>
#import "ABI49_0_0NSTextStorage+FontScaling.h"

@implementation ABI49_0_0RCTTextShadowView {
  __weak ABI49_0_0RCTBridge *_bridge;
  BOOL _needsUpdateView;
  NSMapTable<id, NSTextStorage *> *_cachedTextStorages;
}

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _cachedTextStorages = [NSMapTable strongToStrongObjectsMapTable];
    _needsUpdateView = YES;
    ABI49_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI49_0_0RCTTextShadowViewMeasure);
    ABI49_0_0YGNodeSetBaselineFunc(self.yogaNode, ABI49_0_0RCTTextShadowViewBaseline);
  }

  return self;
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];

  // When applying a semi-transparent background color to Text component
  // we must set the root text nodes text attribute background color to nil
  // because the background color is drawn on the ABI49_0_0RCTTextView itself, as well
  // as on the glphy background draw step. By setting this to nil, we allow
  // the ABI49_0_0RCTTextView backgroundColor to be used, without affecting nested Text
  // components.
  self.textAttributes.backgroundColor = nil;
  self.textAttributes.opacity = NAN;
}

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (void)dirtyLayout
{
  [super dirtyLayout];
  ABI49_0_0YGNodeMarkDirty(self.yogaNode);
  [self invalidateCache];
}

- (void)invalidateCache
{
  [_cachedTextStorages removeAllObjects];
  _needsUpdateView = YES;
}

#pragma mark - ABI49_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting
{
  if (ABI49_0_0YGNodeIsDirty(self.yogaNode)) {
    return;
  }

  if (!_needsUpdateView) {
    return;
  }
  _needsUpdateView = NO;

  CGRect contentFrame = self.contentFrame;
  NSTextStorage *textStorage = [self textStorageAndLayoutManagerThatFitsSize:self.contentFrame.size
                                                          exclusiveOwnership:YES];

  NSNumber *tag = self.ABI49_0_0ReactTag;
  NSMutableArray<NSNumber *> *descendantViewTags = [NSMutableArray new];
  [textStorage enumerateAttribute:ABI49_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                          inRange:NSMakeRange(0, textStorage.length)
                          options:0
                       usingBlock:^(ABI49_0_0RCTShadowView *shadowView, NSRange range, __unused BOOL *stop) {
                         if (!shadowView) {
                           return;
                         }

                         [descendantViewTags addObject:shadowView.ABI49_0_0ReactTag];
                       }];

  [_bridge.uiManager addUIBlock:^(ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI49_0_0RCTTextView *textView = (ABI49_0_0RCTTextView *)viewRegistry[tag];
    if (!textView) {
      return;
    }

    NSMutableArray<UIView *> *descendantViews = [NSMutableArray arrayWithCapacity:descendantViewTags.count];
    [descendantViewTags
        enumerateObjectsUsingBlock:^(NSNumber *_Nonnull descendantViewTag, NSUInteger index, BOOL *_Nonnull stop) {
          UIView *descendantView = viewRegistry[descendantViewTag];
          if (!descendantView) {
            return;
          }

          [descendantViews addObject:descendantView];
        }];

    // Removing all references to Shadow Views to avoid unnecessary retaining.
    [textStorage removeAttribute:ABI49_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                           range:NSMakeRange(0, textStorage.length)];

    [textView setTextStorage:textStorage contentFrame:contentFrame descendantViews:descendantViews];
  }];
}

- (void)postprocessAttributedText:(NSMutableAttributedString *)attributedText
{
  __block CGFloat maximumLineHeight = 0;

  [attributedText enumerateAttribute:NSParagraphStyleAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(NSParagraphStyle *paragraphStyle, __unused NSRange range, __unused BOOL *stop) {
                            if (!paragraphStyle) {
                              return;
                            }

                            maximumLineHeight = MAX(paragraphStyle.maximumLineHeight, maximumLineHeight);
                          }];

  if (maximumLineHeight == 0) {
    // `lineHeight` was not specified, nothing to do.
    return;
  }

  __block CGFloat maximumFontLineHeight = 0;

  [attributedText enumerateAttribute:NSFontAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(UIFont *font, NSRange range, __unused BOOL *stop) {
                            if (!font) {
                              return;
                            }

                            if (maximumFontLineHeight <= font.lineHeight) {
                              maximumFontLineHeight = font.lineHeight;
                            }
                          }];

  if (maximumLineHeight < maximumFontLineHeight) {
    return;
  }

  CGFloat baseLineOffset = maximumLineHeight / 2.0 - maximumFontLineHeight / 2.0;

  [attributedText addAttribute:NSBaselineOffsetAttributeName
                         value:@(baseLineOffset)
                         range:NSMakeRange(0, attributedText.length)];
}

- (NSAttributedString *)attributedTextWithMeasuredAttachmentsThatFitSize:(CGSize)size
{
  static UIImage *placeholderImage;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    placeholderImage = [UIImage new];
  });

  NSMutableAttributedString *attributedText =
      [[NSMutableAttributedString alloc] initWithAttributedString:[self attributedTextWithBaseTextAttributes:nil]];

  [attributedText beginEditing];

  [attributedText enumerateAttribute:ABI49_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:0
                          usingBlock:^(ABI49_0_0RCTShadowView *shadowView, NSRange range, __unused BOOL *stop) {
                            if (!shadowView) {
                              return;
                            }

                            CGSize fittingSize = [shadowView sizeThatFitsMinimumSize:CGSizeZero maximumSize:size];
                            NSTextAttachment *attachment = [NSTextAttachment new];
                            attachment.bounds = (CGRect){CGPointZero, fittingSize};
                            attachment.image = placeholderImage;
                            [attributedText addAttribute:NSAttachmentAttributeName value:attachment range:range];
                          }];

  [attributedText endEditing];

  return [attributedText copy];
}

- (NSTextStorage *)textStorageAndLayoutManagerThatFitsSize:(CGSize)size exclusiveOwnership:(BOOL)exclusiveOwnership
{
  NSValue *key = [NSValue valueWithCGSize:size];
  NSTextStorage *cachedTextStorage = [_cachedTextStorages objectForKey:key];

  if (cachedTextStorage) {
    if (exclusiveOwnership) {
      [_cachedTextStorages removeObjectForKey:key];
    }

    return cachedTextStorage;
  }

  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];

  textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
  textContainer.lineBreakMode = _maximumNumberOfLines > 0 ? _lineBreakMode : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = _maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  layoutManager.usesFontLeading = NO;
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage =
      [[NSTextStorage alloc] initWithAttributedString:[self attributedTextWithMeasuredAttachmentsThatFitSize:size]];

  [self postprocessAttributedText:textStorage];

  [textStorage addLayoutManager:layoutManager];

  if (_adjustsFontSizeToFit) {
    CGFloat minimumFontSize = MAX(_minimumFontScale * (self.textAttributes.effectiveFont.pointSize), 4.0);
    [textStorage abi49_0_0_rct_scaleFontSizeToFitSize:size
                        minimumFontSize:minimumFontSize
                        maximumFontSize:self.textAttributes.effectiveFont.pointSize];
  }

  if (!exclusiveOwnership) {
    [_cachedTextStorages setObject:textStorage forKey:key];
  }

  return textStorage;
}

- (void)layoutWithMetrics:(ABI49_0_0RCTLayoutMetrics)layoutMetrics layoutContext:(ABI49_0_0RCTLayoutContext)layoutContext
{
  // If the view got new `contentFrame`, we have to redraw it because
  // and sizes of embedded views may change.
  if (!CGRectEqualToRect(self.layoutMetrics.contentFrame, layoutMetrics.contentFrame)) {
    _needsUpdateView = YES;
  }

  if (self.textAttributes.layoutDirection != layoutMetrics.layoutDirection) {
    self.textAttributes.layoutDirection = layoutMetrics.layoutDirection;
    [self invalidateCache];
  }

  [super layoutWithMetrics:layoutMetrics layoutContext:layoutContext];
}

- (void)layoutSubviewsWithContext:(ABI49_0_0RCTLayoutContext)layoutContext
{
  NSTextStorage *textStorage = [self textStorageAndLayoutManagerThatFitsSize:self.availableSize exclusiveOwnership:NO];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];

  [textStorage
      enumerateAttribute:ABI49_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                 inRange:characterRange
                 options:0
              usingBlock:^(ABI49_0_0RCTShadowView *shadowView, NSRange range, BOOL *stop) {
                if (!shadowView) {
                  return;
                }

                CGRect glyphRect = [layoutManager boundingRectForGlyphRange:range inTextContainer:textContainer];

                NSTextAttachment *attachment = [textStorage attribute:NSAttachmentAttributeName
                                                              atIndex:range.location
                                                       effectiveRange:nil];

                CGSize attachmentSize = attachment.bounds.size;

                UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:range.location effectiveRange:nil];

                CGRect frame = {
                    {ABI49_0_0RCTRoundPixelValue(glyphRect.origin.x),
                     ABI49_0_0RCTRoundPixelValue(
                         glyphRect.origin.y + glyphRect.size.height - attachmentSize.height + font.descender)},
                    {ABI49_0_0RCTRoundPixelValue(attachmentSize.width), ABI49_0_0RCTRoundPixelValue(attachmentSize.height)}};

                NSRange truncatedGlyphRange =
                    [layoutManager truncatedGlyphRangeInLineFragmentForGlyphAtIndex:range.location];
                BOOL viewIsTruncated = NSIntersectionRange(range, truncatedGlyphRange).length != 0;

                ABI49_0_0RCTLayoutContext localLayoutContext = layoutContext;
                localLayoutContext.absolutePosition.x += frame.origin.x;
                localLayoutContext.absolutePosition.y += frame.origin.y;

                [shadowView layoutWithMinimumSize:frame.size
                                      maximumSize:frame.size
                                  layoutDirection:self.layoutMetrics.layoutDirection
                                    layoutContext:localLayoutContext];

                ABI49_0_0RCTLayoutMetrics localLayoutMetrics = shadowView.layoutMetrics;
                localLayoutMetrics.frame.origin =
                    frame.origin; // Reinforcing a proper frame origin for the Shadow View.
                if (viewIsTruncated) {
                  localLayoutMetrics.displayType = ABI49_0_0RCTDisplayTypeNone;
                }
                [shadowView layoutWithMetrics:localLayoutMetrics layoutContext:localLayoutContext];
              }];

  if (_onTextLayout) {
    NSMutableArray *lineData = [NSMutableArray new];
    [layoutManager enumerateLineFragmentsForGlyphRange:glyphRange
                                            usingBlock:^(
                                                CGRect overallRect,
                                                CGRect usedRect,
                                                NSTextContainer *_Nonnull usedTextContainer,
                                                NSRange lineGlyphRange,
                                                BOOL *_Nonnull stop) {
                                              NSRange range = [layoutManager characterRangeForGlyphRange:lineGlyphRange
                                                                                        actualGlyphRange:nil];
                                              NSString *renderedString = [textStorage.string substringWithRange:range];
                                              UIFont *font = [[textStorage attributedSubstringFromRange:range]
                                                       attribute:NSFontAttributeName
                                                         atIndex:0
                                                  effectiveRange:nil];
                                              [lineData addObject:@{
                                                @"text" : renderedString,
                                                @"x" : @(usedRect.origin.x),
                                                @"y" : @(usedRect.origin.y),
                                                @"width" : @(usedRect.size.width),
                                                @"height" : @(usedRect.size.height),
                                                @"descender" : @(-font.descender),
                                                @"capHeight" : @(font.capHeight),
                                                @"ascender" : @(font.ascender),
                                                @"xHeight" : @(font.xHeight),
                                              }];
                                            }];
    NSDictionary *payload = @{
      @"lines" : lineData,
    };
    _onTextLayout(payload);
  }
}

- (CGFloat)lastBaselineForSize:(CGSize)size
{
  NSAttributedString *attributedText = [self textStorageAndLayoutManagerThatFitsSize:size exclusiveOwnership:NO];

  __block CGFloat maximumDescender = 0.0;

  [attributedText enumerateAttribute:NSFontAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:^(UIFont *font, NSRange range, __unused BOOL *stop) {
                            if (maximumDescender > font.descender) {
                              maximumDescender = font.descender;
                            }
                          }];

  return size.height + maximumDescender;
}

static ABI49_0_0YGSize
ABI49_0_0RCTTextShadowViewMeasure(ABI49_0_0YGNodeRef node, float width, ABI49_0_0YGMeasureMode widthMode, float height, ABI49_0_0YGMeasureMode heightMode)
{
  CGSize maximumSize = (CGSize){
      widthMode == ABI49_0_0YGMeasureModeUndefined ? CGFLOAT_MAX : ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(width),
      heightMode == ABI49_0_0YGMeasureModeUndefined ? CGFLOAT_MAX : ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(height),
  };

  ABI49_0_0RCTTextShadowView *shadowTextView = (__bridge ABI49_0_0RCTTextShadowView *)ABI49_0_0YGNodeGetContext(node);

  NSTextStorage *textStorage = [shadowTextView textStorageAndLayoutManagerThatFitsSize:maximumSize
                                                                    exclusiveOwnership:NO];

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];
  CGSize size = [layoutManager usedRectForTextContainer:textContainer].size;

  CGFloat letterSpacing = shadowTextView.textAttributes.letterSpacing;
  if (!isnan(letterSpacing) && letterSpacing < 0) {
    size.width -= letterSpacing;
  }

  size = (CGSize){
      MIN(ABI49_0_0RCTCeilPixelValue(size.width), maximumSize.width), MIN(ABI49_0_0RCTCeilPixelValue(size.height), maximumSize.height)};

  // Adding epsilon value illuminates problems with converting values from
  // `double` to `float`, and then rounding them to pixel grid in Yoga.
  CGFloat epsilon = 0.001;
  return (ABI49_0_0YGSize){
      ABI49_0_0RCTYogaFloatFromCoreGraphicsFloat(size.width + epsilon),
      ABI49_0_0RCTYogaFloatFromCoreGraphicsFloat(size.height + epsilon)};
}

static float ABI49_0_0RCTTextShadowViewBaseline(ABI49_0_0YGNodeRef node, const float width, const float height)
{
  ABI49_0_0RCTTextShadowView *shadowTextView = (__bridge ABI49_0_0RCTTextShadowView *)ABI49_0_0YGNodeGetContext(node);

  CGSize size = (CGSize){ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(width), ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(height)};

  CGFloat lastBaseline = [shadowTextView lastBaselineForSize:size];

  return ABI49_0_0RCTYogaFloatFromCoreGraphicsFloat(lastBaseline);
}

@end
