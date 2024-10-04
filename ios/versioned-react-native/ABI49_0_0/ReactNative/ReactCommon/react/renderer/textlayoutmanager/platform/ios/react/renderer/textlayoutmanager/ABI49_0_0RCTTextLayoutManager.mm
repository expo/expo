/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTTextLayoutManager.h"

#import "ABI49_0_0NSTextStorage+FontScaling.h"
#import "ABI49_0_0RCTAttributedTextUtils.h"

#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0React/utils/ABI49_0_0ManagedObjectWrapper.h>
#import <ABI49_0_0React/utils/ABI49_0_0SimpleThreadSafeCache.h>

using namespace ABI49_0_0facebook::ABI49_0_0React;

@implementation ABI49_0_0RCTTextLayoutManager {
  SimpleThreadSafeCache<AttributedString, std::shared_ptr<void>, 256> _cache;
}

static NSLineBreakMode ABI49_0_0RCTNSLineBreakModeFromEllipsizeMode(EllipsizeMode ellipsizeMode)
{
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

- (TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                         paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                           layoutConstraints:(LayoutConstraints)layoutConstraints
                                 textStorage:(NSTextStorage *_Nullable)textStorage
{
  if (attributedString.length == 0) {
    // This is not really an optimization because that should be checked much earlier on the call stack.
    // Sometimes, very irregularly, measuring an empty string crashes/freezes iOS internal text infrastructure.
    // This is our last line of defense.
    return {};
  }

  CGSize maximumSize = CGSize{layoutConstraints.maximumSize.width, CGFLOAT_MAX};

  if (!textStorage) {
    textStorage = [self _textStorageForNSAttributesString:attributedString
                                      paragraphAttributes:paragraphAttributes
                                                     size:maximumSize];
  }

  return [self _measureTextStorage:textStorage];
}

- (TextMeasurement)measureAttributedString:(AttributedString)attributedString
                       paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                         layoutConstraints:(LayoutConstraints)layoutConstraints
                               textStorage:(NSTextStorage *_Nullable)textStorage
{
  if (textStorage) {
    return [self _measureTextStorage:textStorage];
  } else {
    return [self measureNSAttributedString:[self _nsAttributedStringFromAttributedString:attributedString]
                       paragraphAttributes:paragraphAttributes
                         layoutConstraints:layoutConstraints
                               textStorage:nil];
  }
}

- (void)drawAttributedString:(AttributedString)attributedString
         paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame
                 textStorage:(NSTextStorage *_Nullable)textStorage
{
  BOOL createdStorageForFrame = NO;

  if (!textStorage) {
    textStorage = [self textStorageForAttributesString:attributedString
                                   paragraphAttributes:paragraphAttributes
                                                  size:frame.size];
    createdStorageForFrame = YES;
  }

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  CGPoint origin = frame.origin;

  if (!createdStorageForFrame) {
    CGRect rect = [layoutManager usedRectForTextContainer:textContainer];
    static auto threshold = 1.0 / ABI49_0_0RCTScreenScale() + 0.01; // Size of a pixel plus some small threshold.

    // `rect`'s width is stored in double precesion.
    // `frame`'s width is also in double precesion but was stored as float in Yoga previously, precesion was lost.
    if (std::abs(ABI49_0_0RCTCeilPixelValue(rect.size.width) - frame.size.width) < threshold) {
      // `textStorage` passed to this method was used to calculate size of frame. If that's the case, it's
      // width is the same as frame's width. Origin must be adjusted, otherwise glyhps will be painted in wrong
      // place.
      // We could create new `NSTextStorage` for the specific frame, but that is expensive.
      origin.x -= ABI49_0_0RCTCeilPixelValue(rect.origin.x);
    }
  }

#if TARGET_OS_MACCATALYST
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSaveGState(context);
  CGContextSetShouldSmoothFonts(context, NO);
#endif

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  [layoutManager drawBackgroundForGlyphRange:glyphRange atPoint:origin];
  [layoutManager drawGlyphsForGlyphRange:glyphRange atPoint:origin];

#if TARGET_OS_MACCATALYST
  CGContextRestoreGState(context);
#endif
}

- (LinesMeasurements)getLinesForAttributedString:(AttributedString)attributedString
                             paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                            size:(CGSize)size
{
  NSTextStorage *textStorage = [self textStorageForAttributesString:attributedString
                                                paragraphAttributes:paragraphAttributes
                                                               size:size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];

  std::vector<LineMeasurement> paragraphLines{};
  auto blockParagraphLines = &paragraphLines;

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
                                            auto rect = ABI49_0_0facebook::ABI49_0_0React::Rect{
                                                ABI49_0_0facebook::ABI49_0_0React::Point{usedRect.origin.x, usedRect.origin.y},
                                                ABI49_0_0facebook::ABI49_0_0React::Size{usedRect.size.width, usedRect.size.height}};
                                            auto line = LineMeasurement{
                                                std::string([renderedString UTF8String]),
                                                rect,
                                                -font.descender,
                                                font.capHeight,
                                                font.ascender,
                                                font.xHeight};
                                            blockParagraphLines->push_back(line);
                                          }];
  return paragraphLines;
}

- (NSTextStorage *)textStorageForAttributesString:(AttributedString)attributedString
                              paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                             size:(CGSize)size
{
  return [self _textStorageForNSAttributesString:[self _nsAttributedStringFromAttributedString:attributedString]
                             paragraphAttributes:paragraphAttributes
                                            size:size];
}

- (SharedEventEmitter)getEventEmitterWithAttributeString:(AttributedString)attributedString
                                     paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                   frame:(CGRect)frame
                                                 atPoint:(CGPoint)point
{
  NSTextStorage *textStorage = [self textStorageForAttributesString:attributedString
                                                paragraphAttributes:paragraphAttributes
                                                               size:frame.size];
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;

  CGFloat fraction;
  NSUInteger characterIndex = [layoutManager characterIndexForPoint:point
                                                    inTextContainer:textContainer
                           fractionOfDistanceBetweenInsertionPoints:&fraction];

  // If the point is not before (fraction == 0.0) the first character and not
  // after (fraction == 1.0) the last character, then the attribute is valid.
  if (textStorage.length > 0 && (fraction > 0 || characterIndex > 0) &&
      (fraction < 1 || characterIndex < textStorage.length - 1)) {
    ABI49_0_0RCTWeakEventEmitterWrapper *eventEmitterWrapper =
        (ABI49_0_0RCTWeakEventEmitterWrapper *)[textStorage attribute:ABI49_0_0RCTAttributedStringEventEmitterKey
                                                     atIndex:characterIndex
                                              effectiveRange:NULL];
    return eventEmitterWrapper.eventEmitter;
  }

  return nil;
}

- (void)getRectWithAttributedString:(AttributedString)attributedString
                paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(ABI49_0_0RCTTextLayoutFragmentEnumerationBlock)block
{
  NSTextStorage *textStorage = [self textStorageForAttributesString:attributedString
                                                paragraphAttributes:paragraphAttributes
                                                               size:frame.size];

  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  NSRange glyphRange = [layoutManager glyphRangeForTextContainer:textContainer];
  NSRange characterRange = [layoutManager characterRangeForGlyphRange:glyphRange actualGlyphRange:NULL];

  [textStorage enumerateAttribute:enumerateAttribute
                          inRange:characterRange
                          options:0
                       usingBlock:^(NSString *value, NSRange range, BOOL *pause) {
                         if (!value) {
                           return;
                         }

                         [layoutManager
                             enumerateEnclosingRectsForGlyphRange:range
                                         withinSelectedGlyphRange:range
                                                  inTextContainer:textContainer
                                                       usingBlock:^(CGRect enclosingRect, BOOL *_Nonnull stop) {
                                                         block(
                                                             enclosingRect,
                                                             [textStorage attributedSubstringFromRange:range].string,
                                                             value);
                                                         *stop = YES;
                                                       }];
                       }];
}

#pragma mark - Private

- (NSTextStorage *)_textStorageForNSAttributesString:(NSAttributedString *)attributedString
                                 paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                size:(CGSize)size
{
  NSTextContainer *textContainer = [[NSTextContainer alloc] initWithSize:size];

  textContainer.lineFragmentPadding = 0.0; // Note, the default value is 5.
  textContainer.lineBreakMode = paragraphAttributes.maximumNumberOfLines > 0
      ? ABI49_0_0RCTNSLineBreakModeFromEllipsizeMode(paragraphAttributes.ellipsizeMode)
      : NSLineBreakByClipping;
  textContainer.maximumNumberOfLines = paragraphAttributes.maximumNumberOfLines;

  NSLayoutManager *layoutManager = [NSLayoutManager new];
  layoutManager.usesFontLeading = NO;
  [layoutManager addTextContainer:textContainer];

  NSTextStorage *textStorage = [[NSTextStorage alloc] initWithAttributedString:attributedString];

  [textStorage addLayoutManager:layoutManager];

  if (paragraphAttributes.adjustsFontSizeToFit) {
    CGFloat minimumFontSize = !isnan(paragraphAttributes.minimumFontSize) ? paragraphAttributes.minimumFontSize : 4.0;
    CGFloat maximumFontSize = !isnan(paragraphAttributes.maximumFontSize) ? paragraphAttributes.maximumFontSize : 96.0;
    [textStorage scaleFontSizeToFitSize:size minimumFontSize:minimumFontSize maximumFontSize:maximumFontSize];
  }

  return textStorage;
}

- (NSAttributedString *)_nsAttributedStringFromAttributedString:(AttributedString)attributedString
{
  auto sharedNSAttributedString = _cache.get(attributedString, [](AttributedString attributedString) {
    return wrapManagedObject(ABI49_0_0RCTNSAttributedStringFromAttributedString(attributedString));
  });

  return unwrapManagedObject(sharedNSAttributedString);
}

- (TextMeasurement)_measureTextStorage:(NSTextStorage *)textStorage
{
  NSLayoutManager *layoutManager = textStorage.layoutManagers.firstObject;
  NSTextContainer *textContainer = layoutManager.textContainers.firstObject;
  [layoutManager ensureLayoutForTextContainer:textContainer];

  CGSize size = [layoutManager usedRectForTextContainer:textContainer].size;

  size = (CGSize){ABI49_0_0RCTCeilPixelValue(size.width), ABI49_0_0RCTCeilPixelValue(size.height)};

  __block auto attachments = TextMeasurement::Attachments{};

  [textStorage
      enumerateAttribute:NSAttachmentAttributeName
                 inRange:NSMakeRange(0, textStorage.length)
                 options:0
              usingBlock:^(NSTextAttachment *attachment, NSRange range, BOOL *stop) {
                if (!attachment) {
                  return;
                }

                CGSize attachmentSize = attachment.bounds.size;
                CGRect glyphRect = [layoutManager boundingRectForGlyphRange:range inTextContainer:textContainer];

                UIFont *font = [textStorage attribute:NSFontAttributeName atIndex:range.location effectiveRange:nil];

                CGRect frame = {
                    {glyphRect.origin.x,
                     glyphRect.origin.y + glyphRect.size.height - attachmentSize.height + font.descender},
                    attachmentSize};

                auto rect = ABI49_0_0facebook::ABI49_0_0React::Rect{
                    ABI49_0_0facebook::ABI49_0_0React::Point{frame.origin.x, frame.origin.y},
                    ABI49_0_0facebook::ABI49_0_0React::Size{frame.size.width, frame.size.height}};

                attachments.push_back(TextMeasurement::Attachment{rect, false});
              }];

  return TextMeasurement{{size.width, size.height}, attachments};
}

@end
