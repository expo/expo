/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedString.h>
#import <ABI49_0_0React/renderer/attributedstring/ABI49_0_0ParagraphAttributes.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0LayoutConstraints.h>
#import <ABI49_0_0React/renderer/textlayoutmanager/ABI49_0_0TextMeasureCache.h>

NS_ASSUME_NONNULL_BEGIN

/**
 @abstract Enumeration block for text fragments.
*/

using ABI49_0_0RCTTextLayoutFragmentEnumerationBlock =
    void (^)(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value);

/**
 * iOS-specific TextLayoutManager
 */
@interface ABI49_0_0RCTTextLayoutManager : NSObject

- (ABI49_0_0facebook::ABI49_0_0React::TextMeasurement)measureAttributedString:(ABI49_0_0facebook::ABI49_0_0React::AttributedString)attributedString
                                        paragraphAttributes:(ABI49_0_0facebook::ABI49_0_0React::ParagraphAttributes)paragraphAttributes
                                          layoutConstraints:(ABI49_0_0facebook::ABI49_0_0React::LayoutConstraints)layoutConstraints
                                                textStorage:(NSTextStorage *_Nullable)textStorage;

- (ABI49_0_0facebook::ABI49_0_0React::TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                                          paragraphAttributes:(ABI49_0_0facebook::ABI49_0_0React::ParagraphAttributes)paragraphAttributes
                                            layoutConstraints:(ABI49_0_0facebook::ABI49_0_0React::LayoutConstraints)layoutConstraints
                                                  textStorage:(NSTextStorage *_Nullable)textStorage;

- (NSTextStorage *)textStorageForAttributesString:(ABI49_0_0facebook::ABI49_0_0React::AttributedString)attributedString
                              paragraphAttributes:(ABI49_0_0facebook::ABI49_0_0React::ParagraphAttributes)paragraphAttributes
                                             size:(CGSize)size;

- (void)drawAttributedString:(ABI49_0_0facebook::ABI49_0_0React::AttributedString)attributedString
         paragraphAttributes:(ABI49_0_0facebook::ABI49_0_0React::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame
                 textStorage:(NSTextStorage *_Nullable)textStorage;

- (ABI49_0_0facebook::ABI49_0_0React::LinesMeasurements)getLinesForAttributedString:(ABI49_0_0facebook::ABI49_0_0React::AttributedString)attributedString
                                              paragraphAttributes:
                                                  (ABI49_0_0facebook::ABI49_0_0React::ParagraphAttributes)paragraphAttributes
                                                             size:(CGSize)size;

- (ABI49_0_0facebook::ABI49_0_0React::SharedEventEmitter)
    getEventEmitterWithAttributeString:(ABI49_0_0facebook::ABI49_0_0React::AttributedString)attributedString
                   paragraphAttributes:(ABI49_0_0facebook::ABI49_0_0React::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

- (void)getRectWithAttributedString:(ABI49_0_0facebook::ABI49_0_0React::AttributedString)attributedString
                paragraphAttributes:(ABI49_0_0facebook::ABI49_0_0React::ParagraphAttributes)paragraphAttributes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(ABI49_0_0RCTTextLayoutFragmentEnumerationBlock)block;

@end

NS_ASSUME_NONNULL_END
