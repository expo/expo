/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTBaseTextInputShadowView.h"

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTShadowView+Layout.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ABI30_0_0yoga/ABI30_0_0Yoga.h>

#import "ABI30_0_0NSTextStorage+FontScaling.h"
#import "ABI30_0_0RCTBaseTextInputView.h"

@implementation ABI30_0_0RCTBaseTextInputShadowView
{
  __weak ABI30_0_0RCTBridge *_bridge;
  NSAttributedString *_Nullable _previousAttributedText;
  BOOL _needsUpdateView;
  NSAttributedString *_Nullable _localAttributedText;
  CGSize _previousContentSize;

  NSTextStorage *_textStorage;
  NSTextContainer *_textContainer;
  NSLayoutManager *_layoutManager;
}

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _needsUpdateView = YES;

    ABI30_0_0YGNodeSetMeasureFunc(self.yogaNode, ABI30_0_0RCTBaseTextInputShadowViewMeasure);
    ABI30_0_0YGNodeSetBaselineFunc(self.yogaNode, ABI30_0_0RCTTextInputShadowViewBaseline);
  }

  return self;
}

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (void)layoutSubviewsWithContext:(ABI30_0_0RCTLayoutContext)layoutContext
{
  // Do nothing.
}

- (void)setLocalData:(NSObject *)localData
{
  NSAttributedString *attributedText = (NSAttributedString *)localData;

  if ([attributedText isEqualToAttributedString:_localAttributedText]) {
    return;
  }

  _localAttributedText = attributedText;
  [self dirtyLayout];
}

- (void)dirtyLayout
{
  [super dirtyLayout];
  _needsUpdateView = YES;
  ABI30_0_0YGNodeMarkDirty(self.yogaNode);
  [self invalidateContentSize];
}

- (void)invalidateContentSize
{
  if (!_onContentSizeChange) {
    return;
  }

  CGSize maximumSize = self.layoutMetrics.frame.size;

  if (_maximumNumberOfLines == 1) {
    maximumSize.width = CGFLOAT_MAX;
  } else {
    maximumSize.height = CGFLOAT_MAX;
  }

  CGSize contentSize = [self sizeThatFitsMinimumSize:(CGSize)CGSizeZero maximumSize:maximumSize];

  if (CGSizeEqualToSize(_previousContentSize, contentSize)) {
    return;
  }
  _previousContentSize = contentSize;

  _onContentSizeChange(@{
    @"contentSize": @{
      @"height": @(contentSize.height),
      @"width": @(contentSize.width),
    },
    @"target": self.ReactABI30_0_0Tag,
  });
}

#pragma mark - ABI30_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting
{
  if (ABI30_0_0YGNodeIsDirty(self.yogaNode)) {
    return;
  }

  if (!_needsUpdateView) {
    return;
  }
  _needsUpdateView = NO;

  UIEdgeInsets borderInsets = self.borderAsInsets;
  UIEdgeInsets paddingInsets = self.paddingAsInsets;

  ABI30_0_0RCTTextAttributes *textAttributes = [self.textAttributes copy];

  NSMutableAttributedString *attributedText =
    [[NSMutableAttributedString alloc] initWithAttributedString:[self attributedTextWithBaseTextAttributes:nil]];

  // Removing all references to Shadow Views and tags to avoid unnececery retainning
  // and problems with comparing the strings.
  [attributedText removeAttribute:ABI30_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                            range:NSMakeRange(0, attributedText.length)];

  [attributedText removeAttribute:ABI30_0_0RCTTextAttributesTagAttributeName
                            range:NSMakeRange(0, attributedText.length)];

  if (self.text.length) {
    NSAttributedString *propertyAttributedText =
      [[NSAttributedString alloc] initWithString:self.text
                                      attributes:self.textAttributes.effectiveTextAttributes];
    [attributedText insertAttributedString:propertyAttributedText atIndex:0];
  }

  BOOL isAttributedTextChanged = NO;
  if (![_previousAttributedText isEqualToAttributedString:attributedText]) {
    // We have to follow `set prop` pattern:
    // If the value has not changed, we must not notify the view about the change,
    // otherwise we may break local (temporary) state of the text input.
    isAttributedTextChanged = YES;
    _previousAttributedText = [attributedText copy];
  }

  NSNumber *tag = self.ReactABI30_0_0Tag;

  [_bridge.uiManager addUIBlock:^(ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI30_0_0RCTBaseTextInputView *baseTextInputView = (ABI30_0_0RCTBaseTextInputView *)viewRegistry[tag];
    if (!baseTextInputView) {
      return;
    }

    baseTextInputView.textAttributes = textAttributes;
    baseTextInputView.ReactABI30_0_0BorderInsets = borderInsets;
    baseTextInputView.ReactABI30_0_0PaddingInsets = paddingInsets;

    if (isAttributedTextChanged) {
      baseTextInputView.attributedText = attributedText;
    }
  }];
}

#pragma mark -

- (NSAttributedString *)measurableAttributedText
{
  // Only for the very first render when we don't have `_localAttributedText`,
  // we use value directly from the property and/or nested content.
  NSAttributedString *attributedText =
    _localAttributedText ?: [self attributedTextWithBaseTextAttributes:nil];

  if (attributedText.length == 0) {
    // It's impossible to measure empty attributed string because all attributes are
    // assosiated with some characters, so no characters means no data.

    // Placeholder also can represent the intrinsic size when it is visible.
    NSString *text = self.placeholder;
    if (!text.length) {
      // Zero-width space
      text = @"\u200B";
    }
    attributedText = [[NSAttributedString alloc] initWithString:text attributes:self.textAttributes.effectiveTextAttributes];
  }

  return attributedText;
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  NSAttributedString *attributedText = [self measurableAttributedText];

  if (!_textStorage) {
    _textContainer = [NSTextContainer new];
    _textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
    _layoutManager = [NSLayoutManager new];
    [_layoutManager addTextContainer:_textContainer];
    _textStorage = [NSTextStorage new];
    [_textStorage addLayoutManager:_layoutManager];
  }

  _textContainer.size = maximumSize;
  _textContainer.maximumNumberOfLines = _maximumNumberOfLines;
  [_textStorage replaceCharactersInRange:(NSRange){0, _textStorage.length}
                    withAttributedString:attributedText];
  [_layoutManager ensureLayoutForTextContainer:_textContainer];
  CGSize size = [_layoutManager usedRectForTextContainer:_textContainer].size;

  return (CGSize){
    MAX(minimumSize.width, MIN(ABI30_0_0RCTCeilPixelValue(size.width), maximumSize.width)),
    MAX(minimumSize.height, MIN(ABI30_0_0RCTCeilPixelValue(size.height), maximumSize.height))
  };
}

- (CGFloat)lastBaselineForSize:(CGSize)size
{
  NSAttributedString *attributedText = [self measurableAttributedText];

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

static ABI30_0_0YGSize ABI30_0_0RCTBaseTextInputShadowViewMeasure(ABI30_0_0YGNodeRef node, float width, ABI30_0_0YGMeasureMode widthMode, float height, ABI30_0_0YGMeasureMode heightMode)
{
  ABI30_0_0RCTShadowView *shadowView = (__bridge ABI30_0_0RCTShadowView *)ABI30_0_0YGNodeGetContext(node);

  CGSize minimumSize = CGSizeMake(0, 0);
  CGSize maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  CGSize size = {
    ABI30_0_0RCTCoreGraphicsFloatFromYogaFloat(width),
    ABI30_0_0RCTCoreGraphicsFloatFromYogaFloat(height)
  };

  switch (widthMode) {
    case ABI30_0_0YGMeasureModeUndefined:
      break;
    case ABI30_0_0YGMeasureModeExactly:
      minimumSize.width = size.width;
      maximumSize.width = size.width;
      break;
    case ABI30_0_0YGMeasureModeAtMost:
      maximumSize.width = size.width;
      break;
  }

  switch (heightMode) {
    case ABI30_0_0YGMeasureModeUndefined:
      break;
    case ABI30_0_0YGMeasureModeExactly:
      minimumSize.height = size.height;
      maximumSize.height = size.height;
      break;
    case ABI30_0_0YGMeasureModeAtMost:
      maximumSize.height = size.height;
      break;
  }

  CGSize measuredSize = [shadowView sizeThatFitsMinimumSize:minimumSize maximumSize:maximumSize];

  return (ABI30_0_0YGSize){
    ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(measuredSize.width),
    ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(measuredSize.height)
  };
}

static float ABI30_0_0RCTTextInputShadowViewBaseline(ABI30_0_0YGNodeRef node, const float width, const float height)
{
  ABI30_0_0RCTBaseTextInputShadowView *shadowTextView = (__bridge ABI30_0_0RCTBaseTextInputShadowView *)ABI30_0_0YGNodeGetContext(node);

  CGSize size = (CGSize){
    ABI30_0_0RCTCoreGraphicsFloatFromYogaFloat(width),
    ABI30_0_0RCTCoreGraphicsFloatFromYogaFloat(height)
  };

  CGFloat lastBaseline = [shadowTextView lastBaselineForSize:size];

  return ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(lastBaseline);
}

@end
