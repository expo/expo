/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTTextShadowView.h"

#import <ReactABI31_0_0/ABI31_0_0RCTBridge.h>
#import <ReactABI31_0_0/ABI31_0_0RCTShadowView+Layout.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import <ABI31_0_0yoga/ABI31_0_0Yoga.h>

#import "ABI31_0_0NSTextStorage+FontScaling.h"
#import "ABI31_0_0RCTTextView.h"

@implementation ABI31_0_0RCTTextShadowView
{
  __weak ABI31_0_0RCTBridge *_bridge;
  BOOL _needsUpdateView;
  NSMapTable<id, NSTextStorage *> *_cachedTextStorages;
}

- (instancetype)initWithBridge:(ABI31_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _cachedTextStorages = [NSMapTable strongToStrongObjectsMapTable];
    _needsUpdateView = YES;
    ABI31_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI31_0_0RCTTextShadowViewMeasure);
    ABI31_0_0YGNodeSetBaselineFunc(self.yogaNode, ABI31_0_0RCTTextShadowViewBaseline);
  }

  return self;
}

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (void)dirtyLayout
{
  [super dirtyLayout];
  ABI31_0_0YGNodeMarkDirty(self.yogaNode);
  [self invalidateCache];
}

- (void)invalidateCache
{
  [_cachedTextStorages removeAllObjects];
  _needsUpdateView = YES;
}

#pragma mark - ABI31_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting
{
  if (ABI31_0_0YGNodeIsDirty(self.yogaNode)) {
    return;
  }

  if (!_needsUpdateView) {
    return;
  }
  _needsUpdateView = NO;

  CGRect contentFrame = self.contentFrame;
  NSTextStorage *textStorage = [self textStorageAndLayoutManagerThatFitsSize:self.contentFrame.size
                                                          exclusiveOwnership:YES];

  NSNumber *tag = self.ReactABI31_0_0Tag;
  NSMutableArray<NSNumber *> *descendantViewTags = [NSMutableArray new];
  [textStorage enumerateAttribute:ABI31_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                          inRange:NSMakeRange(0, textStorage.length)
                          options:0
                       usingBlock:
   ^(ABI31_0_0RCTShadowView *shadowView, NSRange range, __unused BOOL *stop) {
     if (!shadowView) {
       return;
     }

     [descendantViewTags addObject:shadowView.ReactABI31_0_0Tag];
   }
  ];

  [_bridge.uiManager addUIBlock:^(ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI31_0_0RCTTextView *textView = (ABI31_0_0RCTTextView *)viewRegistry[tag];
    if (!textView) {
      return;
    }

    NSMutableArray<UIView *> *descendantViews =
      [NSMutableArray arrayWithCapacity:descendantViewTags.count];
    [descendantViewTags enumerateObjectsUsingBlock:^(NSNumber *_Nonnull descendantViewTag, NSUInteger index, BOOL *_Nonnull stop) {
      UIView *descendantView = viewRegistry[descendantViewTag];
      if (!descendantView) {
        return;
      }

      [descendantViews addObject:descendantView];
    }];

    // Removing all references to Shadow Views to avoid unnececery retainning.
    [textStorage removeAttribute:ABI31_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName range:NSMakeRange(0, textStorage.length)];

    [textView setTextStorage:textStorage
                contentFrame:contentFrame
             descendantViews:descendantViews];
  }];
}

- (void)postprocessAttributedText:(NSMutableAttributedString *)attributedText
{
  __block CGFloat maximumLineHeight = 0;

  [attributedText enumerateAttribute:NSParagraphStyleAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:
    ^(NSParagraphStyle *paragraphStyle, __unused NSRange range, __unused BOOL *stop) {
      if (!paragraphStyle) {
        return;
      }

      maximumLineHeight = MAX(paragraphStyle.maximumLineHeight, maximumLineHeight);
    }
  ];

  if (maximumLineHeight == 0) {
    // `lineHeight` was not specified, nothing to do.
    return;
  }

  [attributedText beginEditing];

  [attributedText enumerateAttribute:NSFontAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:
    ^(UIFont *font, NSRange range, __unused BOOL *stop) {
      if (!font) {
        return;
      }

      if (maximumLineHeight <= font.lineHeight) {
        return;
      }

      CGFloat baseLineOffset = maximumLineHeight / 2.0 - font.lineHeight / 2.0;

      [attributedText addAttribute:NSBaselineOffsetAttributeName
                             value:@(baseLineOffset)
                             range:range];
     }
   ];

   [attributedText endEditing];
}

- (NSAttributedString *)attributedTextWithMeasuredAttachmentsThatFitSize:(CGSize)size
{
  NSMutableAttributedString *attributedText =
    [[NSMutableAttributedString alloc] initWithAttributedString:[self attributedTextWithBaseTextAttributes:nil]];

  [attributedText beginEditing];

  [attributedText enumerateAttribute:ABI31_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                               inRange:NSMakeRange(0, attributedText.length)
                               options:0
                            usingBlock:
    ^(ABI31_0_0RCTShadowView *shadowView, NSRange range, __unused BOOL *stop) {
      if (!shadowView) {
        return;
      }

      CGSize fittingSize = [shadowView sizeThatFitsMinimumSize:CGSizeZero
                                                   maximumSize:size];
      NSTextAttachment *attachment = [NSTextAttachment new];
      attachment.bounds = (CGRect){CGPointZero, fittingSize};
      [attributedText addAttribute:NSAttachmentAttributeName value:attachment range:range];
    }
  ];

  [attributedText endEditing];

  return [attributedText copy];
}

- (NSTextStorage *)textStorageAndLayoutManagerThatFitsSize:(CGSize)size
                                        exclusiveOwnership:(BOOL)exclusiveOwnership
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
  textContainer.lineBreakMode =
    _maximumNumberOfLines > 0 ? _lineBreakMode : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = _maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage =
    [[NSTextStorage alloc] initWithAttributedString:[self attributedTextWithMeasuredAttachmentsThatFitSize:size]];

  [self postprocessAttributedText:textStorage];

  [textStorage addLayoutManager:layoutManager];

  if (_adjustsFontSizeToFit) {
    CGFloat minimumFontSize =
      MAX(_minimumFontScale * (self.textAttributes.effectiveFont.pointSize), 4.0);
    [textStorage abi31_0_0_rct_scaleFontSizeToFitSize:size
                        minimumFontSize:minimumFontSize
                        maximumFontSize:self.textAttributes.effectiveFont.pointSize];
  }

  if (!exclusiveOwnership) {
    [_cachedTextStorages setObject:textStorage forKey:key];
  }

  return textStorage;
}

- (void)layoutWithMetrics:(ABI31_0_0RCTLayoutMetrics)layoutMetrics
            layoutContext:(ABI31_0_0RCTLayoutContext)layoutContext
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

- (void)layoutSubviewsWithContext:(ABI31_0_0RCTLayoutContext)layoutContext
{
  NSTextStorage *textStorage =
    [self textStorageAndLayoutManagerThatFitsSize:self.availableSize
                               exclusiveOwnership:NO];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange
                                                     actualGlyphRange:NULL];

  [textStorage enumerateAttribute:ABI31_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                          inRange:characterRange
                          options:0
                       usingBlock:
    ^(ABI31_0_0RCTShadowView *shadowView, NSRange range, BOOL *stop) {
      if (!shadowView) {
        return;
      }

      CGRect glyphRect = [layoutManager boundingRectForGlyphRange:range
                                                  inTextContainer:textContainer];

      NSTextAttachment *attachment =
        [textStorage attribute:NSAttachmentAttributeName atIndex:range.location effectiveRange:nil];

      CGSize attachmentSize = attachment.bounds.size;

      UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:range.location effectiveRange:nil];

      CGRect frame = {{
        ABI31_0_0RCTRoundPixelValue(glyphRect.origin.x),
        ABI31_0_0RCTRoundPixelValue(glyphRect.origin.y + glyphRect.size.height - attachmentSize.height + font.descender)
      }, {
        ABI31_0_0RCTRoundPixelValue(attachmentSize.width),
        ABI31_0_0RCTRoundPixelValue(attachmentSize.height)
      }};

      ABI31_0_0RCTLayoutContext localLayoutContext = layoutContext;
      localLayoutContext.absolutePosition.x += frame.origin.x;
      localLayoutContext.absolutePosition.y += frame.origin.y;

      [shadowView layoutWithMinimumSize:frame.size
                            maximumSize:frame.size
                        layoutDirection:self.layoutMetrics.layoutDirection
                          layoutContext:localLayoutContext];

      // Reinforcing a proper frame origin for the Shadow View.
      ABI31_0_0RCTLayoutMetrics localLayoutMetrics = shadowView.layoutMetrics;
      localLayoutMetrics.frame.origin = frame.origin;
      [shadowView layoutWithMetrics:localLayoutMetrics layoutContext:localLayoutContext];
    }
  ];
}

- (CGFloat)lastBaselineForSize:(CGSize)size
{
  NSAttributedString *attributedText =
    [self textStorageAndLayoutManagerThatFitsSize:size exclusiveOwnership:NO];

  __block CGFloat maximumDescender = 0.0;

  [attributedText enumerateAttribute:NSFontAttributeName
                             inRange:NSMakeRange(0, attributedText.length)
                             options:NSAttributedStringEnumerationLongestEffectiveRangeNotRequired
                          usingBlock:
    ^(UIFont *font, NSRange range, __unused BOOL *stop) {
      if (maximumDescender > font.descender) {
        maximumDescender = font.descender;
      }
    }
  ];

  return size.height + maximumDescender;
}

static ABI31_0_0YGSize ABI31_0_0RCTTextShadowViewMeasure(ABI31_0_0YGNodeRef node, float width, ABI31_0_0YGMeasureMode widthMode, float height, ABI31_0_0YGMeasureMode heightMode)
{
  CGSize maximumSize = (CGSize){
    widthMode == ABI31_0_0YGMeasureModeUndefined ? CGFLOAT_MAX : ABI31_0_0RCTCoreGraphicsFloatFromYogaFloat(width),
    heightMode == ABI31_0_0YGMeasureModeUndefined ? CGFLOAT_MAX : ABI31_0_0RCTCoreGraphicsFloatFromYogaFloat(height),
  };

  ABI31_0_0RCTTextShadowView *shadowTextView = (__bridge ABI31_0_0RCTTextShadowView *)ABI31_0_0YGNodeGetContext(node);

  NSTextStorage *textStorage =
    [shadowTextView textStorageAndLayoutManagerThatFitsSize:maximumSize
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
    MIN(ABI31_0_0RCTCeilPixelValue(size.width), maximumSize.width),
    MIN(ABI31_0_0RCTCeilPixelValue(size.height), maximumSize.height)
  };

  // Adding epsilon value illuminates problems with converting values from
  // `double` to `float`, and then rounding them to pixel grid in Yoga.
  CGFloat epsilon = 0.001;
  return (ABI31_0_0YGSize){
    ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(size.width + epsilon),
    ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(size.height + epsilon)
  };
}

static float ABI31_0_0RCTTextShadowViewBaseline(ABI31_0_0YGNodeRef node, const float width, const float height)
{
  ABI31_0_0RCTTextShadowView *shadowTextView = (__bridge ABI31_0_0RCTTextShadowView *)ABI31_0_0YGNodeGetContext(node);

  CGSize size = (CGSize){
    ABI31_0_0RCTCoreGraphicsFloatFromYogaFloat(width),
    ABI31_0_0RCTCoreGraphicsFloatFromYogaFloat(height)
  };

  CGFloat lastBaseline = [shadowTextView lastBaselineForSize:size];

  return ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(lastBaseline);
}

@end
