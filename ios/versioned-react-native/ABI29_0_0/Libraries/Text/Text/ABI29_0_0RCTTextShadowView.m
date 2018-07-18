/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTTextShadowView.h"

#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import <ReactABI29_0_0/ABI29_0_0RCTShadowView+Layout.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManager.h>
#import <ABI29_0_0yoga/ABI29_0_0Yoga.h>

#import "ABI29_0_0NSTextStorage+FontScaling.h"
#import "ABI29_0_0RCTTextView.h"

@implementation ABI29_0_0RCTTextShadowView
{
  __weak ABI29_0_0RCTBridge *_bridge;
  BOOL _needsUpdateView;
  NSMapTable<id, NSTextStorage *> *_cachedTextStorages;
}

- (instancetype)initWithBridge:(ABI29_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _cachedTextStorages = [NSMapTable strongToStrongObjectsMapTable];
    _needsUpdateView = YES;
    ABI29_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI29_0_0RCTTextShadowViewMeasure);
    ABI29_0_0YGNodeSetBaselineFunc(self.yogaNode, ABI29_0_0RCTTextShadowViewBaseline);
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
  ABI29_0_0YGNodeMarkDirty(self.yogaNode);
  [self invalidateCache];
}

- (void)invalidateCache
{
  [_cachedTextStorages removeAllObjects];
  _needsUpdateView = YES;
}

#pragma mark - ABI29_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting
{
  if (ABI29_0_0YGNodeIsDirty(self.yogaNode)) {
    return;
  }

  if (!_needsUpdateView) {
    return;
  }
  _needsUpdateView = NO;

  CGRect contentFrame = self.contentFrame;
  NSTextStorage *textStorage = [self textStorageAndLayoutManagerThatFitsSize:self.contentFrame.size
                                                          exclusiveOwnership:YES];

  NSNumber *tag = self.ReactABI29_0_0Tag;
  NSMutableArray<NSNumber *> *descendantViewTags = [NSMutableArray new];
  [textStorage enumerateAttribute:ABI29_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                          inRange:NSMakeRange(0, textStorage.length)
                          options:0
                       usingBlock:
   ^(ABI29_0_0RCTShadowView *shadowView, NSRange range, __unused BOOL *stop) {
     if (!shadowView) {
       return;
     }

     [descendantViewTags addObject:shadowView.ReactABI29_0_0Tag];
   }
  ];

  [_bridge.uiManager addUIBlock:^(ABI29_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI29_0_0RCTTextView *textView = (ABI29_0_0RCTTextView *)viewRegistry[tag];
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
    [textStorage removeAttribute:ABI29_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName range:NSMakeRange(0, textStorage.length)];

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

  [attributedText enumerateAttribute:ABI29_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                               inRange:NSMakeRange(0, attributedText.length)
                               options:0
                            usingBlock:
    ^(ABI29_0_0RCTShadowView *shadowView, NSRange range, __unused BOOL *stop) {
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
    [textStorage ABI29_0_0scaleFontSizeToFitSize:size
                        minimumFontSize:minimumFontSize
                        maximumFontSize:self.textAttributes.effectiveFont.pointSize];
  }

  if (!exclusiveOwnership) {
    [_cachedTextStorages setObject:textStorage forKey:key];
  }

  return textStorage;
}

- (void)layoutWithMetrics:(ABI29_0_0RCTLayoutMetrics)layoutMetrics
            layoutContext:(ABI29_0_0RCTLayoutContext)layoutContext
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

- (void)layoutSubviewsWithContext:(ABI29_0_0RCTLayoutContext)layoutContext
{
  NSTextStorage *textStorage =
    [self textStorageAndLayoutManagerThatFitsSize:self.availableSize
                               exclusiveOwnership:NO];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange
                                                     actualGlyphRange:NULL];

  [textStorage enumerateAttribute:ABI29_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                          inRange:characterRange
                          options:0
                       usingBlock:
    ^(ABI29_0_0RCTShadowView *shadowView, NSRange range, BOOL *stop) {
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
        ABI29_0_0RCTRoundPixelValue(glyphRect.origin.x),
        ABI29_0_0RCTRoundPixelValue(glyphRect.origin.y + glyphRect.size.height - attachmentSize.height + font.descender)
      }, {
        ABI29_0_0RCTRoundPixelValue(attachmentSize.width),
        ABI29_0_0RCTRoundPixelValue(attachmentSize.height)
      }};

      ABI29_0_0RCTLayoutContext localLayoutContext = layoutContext;
      localLayoutContext.absolutePosition.x += frame.origin.x;
      localLayoutContext.absolutePosition.y += frame.origin.y;

      [shadowView layoutWithMinimumSize:frame.size
                            maximumSize:frame.size
                        layoutDirection:self.layoutMetrics.layoutDirection
                          layoutContext:localLayoutContext];

      // Reinforcing a proper frame origin for the Shadow View.
      ABI29_0_0RCTLayoutMetrics localLayoutMetrics = shadowView.layoutMetrics;
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

static ABI29_0_0YGSize ABI29_0_0RCTTextShadowViewMeasure(ABI29_0_0YGNodeRef node, float width, ABI29_0_0YGMeasureMode widthMode, float height, ABI29_0_0YGMeasureMode heightMode)
{
  CGSize maximumSize = (CGSize){
    widthMode == ABI29_0_0YGMeasureModeUndefined ? CGFLOAT_MAX : ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(width),
    heightMode == ABI29_0_0YGMeasureModeUndefined ? CGFLOAT_MAX : ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(height),
  };

  ABI29_0_0RCTTextShadowView *shadowTextView = (__bridge ABI29_0_0RCTTextShadowView *)ABI29_0_0YGNodeGetContext(node);

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
    MIN(ABI29_0_0RCTCeilPixelValue(size.width), maximumSize.width),
    MIN(ABI29_0_0RCTCeilPixelValue(size.height), maximumSize.height)
  };

  // Adding epsilon value illuminates problems with converting values from
  // `double` to `float`, and then rounding them to pixel grid in Yoga.
  CGFloat epsilon = 0.001;
  return (ABI29_0_0YGSize){
    ABI29_0_0RCTYogaFloatFromCoreGraphicsFloat(size.width + epsilon),
    ABI29_0_0RCTYogaFloatFromCoreGraphicsFloat(size.height + epsilon)
  };
}

static float ABI29_0_0RCTTextShadowViewBaseline(ABI29_0_0YGNodeRef node, const float width, const float height)
{
  ABI29_0_0RCTTextShadowView *shadowTextView = (__bridge ABI29_0_0RCTTextShadowView *)ABI29_0_0YGNodeGetContext(node);

  CGSize size = (CGSize){
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(width),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(height)
  };

  CGFloat lastBaseline = [shadowTextView lastBaselineForSize:size];

  return ABI29_0_0RCTYogaFloatFromCoreGraphicsFloat(lastBaseline);
}

@end
