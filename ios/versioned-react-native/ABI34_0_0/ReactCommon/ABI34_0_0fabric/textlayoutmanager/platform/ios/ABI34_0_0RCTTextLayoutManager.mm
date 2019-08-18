/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTTextLayoutManager.h"

#import "ABI34_0_0NSTextStorage+FontScaling.h"
#import "ABI34_0_0RCTAttributedTextUtils.h"

using namespace facebook::ReactABI34_0_0;

@implementation ABI34_0_0RCTTextLayoutManager

static NSLineBreakMode ABI34_0_0RCTNSLineBreakModeFromWritingDirection(
    EllipsizeMode ellipsizeMode) {
  switch (ellipsizeMode) {
    case EllipsizeMode::Clip:
      return NSLineBreakByClipping;
    case EllipsizeMode::Head:
      return NSLineBreakByTruncatingHead;
    case EllipsizeMode::Tail:
      return NSLineBreakByTruncatingTail;
    case EllipsizeMode::Middle:
      return NSLineBreakByTruncatingMiddle;
  }
}

- (facebook::ReactABI34_0_0::Size)
    measureWithAttributedString:(AttributedString)attributedString
            paragraphAttributes:(ParagraphAttributes)paragraphAttributes
              layoutConstraints:(LayoutConstraints)layoutConstraints {
  CGSize maximumSize = CGSize{layoutConstraints.maximumSize.width,
                              layoutConstraints.maximumSize.height};
  NSTextStorage *textStorage =
      [self _textStorageAndLayoutManagerWithAttributesString:
                ABI34_0_0RCTNSAttributedStringFromAttributedString(attributedString)
                                         paragraphAttributes:paragraphAttributes
                                                        size:maximumSize];

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  CGSize size = [layoutManager usedRectForTextContainer:textContainer].size;

  size = (CGSize){MIN(size.width, maximumSize.width),
                  MIN(size.height, maximumSize.height)};

  return facebook::ReactABI34_0_0::Size{size.width, size.height};
}

- (void)drawAttributedString:(AttributedString)attributedString
         paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame {
  NSTextStorage *textStorage =
      [self _textStorageAndLayoutManagerWithAttributesString:
                ABI34_0_0RCTNSAttributedStringFromAttributedString(attributedString)
                                         paragraphAttributes:paragraphAttributes
                                                        size:frame.size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:frame.origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:frame.origin];
}

- (NSTextStorage *)
    _textStorageAndLayoutManagerWithAttributesString:
        (NSAttributedString *)attributedString
                                 paragraphAttributes:
                                     (ParagraphAttributes)paragraphAttributes
                                                size:(CGSize)size {
  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];

  textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
  textContainer.lineBreakMode = paragraphAttributes.maximumNumberOfLines > 0
      ? ABI34_0_0RCTNSLineBreakModeFromWritingDirection(
            paragraphAttributes.ellipsizeMode)
      : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = paragraphAttributes.maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage =
      [[NSTextStorage alloc] initWithAttributedString:attributedString];

  [textStorage addLayoutManager:layoutManager];

  if (paragraphAttributes.adjustsFontSizeToFit) {
    CGFloat minimumFontSize = !isnan(paragraphAttributes.minimumFontSize)
        ? paragraphAttributes.minimumFontSize
        : 4.0;
    CGFloat maximumFontSize = !isnan(paragraphAttributes.maximumFontSize)
        ? paragraphAttributes.maximumFontSize
        : 96.0;
    [textStorage scaleFontSizeToFitSize:size
                        minimumFontSize:minimumFontSize
                        maximumFontSize:maximumFontSize];
  }

  return textStorage;
}

- (SharedEventEmitter)
    getEventEmitterWithAttributeString:(AttributedString)attributedString
                   paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point {
  NSTextStorage *textStorage =
      [self _textStorageAndLayoutManagerWithAttributesString:
                ABI34_0_0RCTNSAttributedStringFromAttributedString(attributedString)
                                         paragraphAttributes:paragraphAttributes
                                                        size:frame.size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  CGFloat fraction;
  NSUInteger characterIndex =
      [layoutManager characterIndexForPoint:point
                                   inTextContainer:textContainer
          fractionOfDistanceBetweenInsertionPoints:&fraction];

  // If the point is not before (fraction == 0.0) the first character and not
  // after (fraction == 1.0) the last character, then the attribute is valid.
  if (textStorage.length > 0 && (fraction > 0 || characterIndex > 0) &&
      (fraction < 1 || characterIndex < textStorage.length - 1)) {
    ABI34_0_0RCTWeakEventEmitterWrapper *eventEmitterWrapper =
        (ABI34_0_0RCTWeakEventEmitterWrapper *)[textStorage
                 attribute:ABI34_0_0RCTAttributedStringEventEmitterKey
                   atIndex:characterIndex
            effectiveRange:NULL];
    return eventEmitterWrapper.eventEmitter;
  }

  return nil;
}

@end
