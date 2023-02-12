/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0renderer/attributedstring/AttributedString.h>
#import <ABI47_0_0React/ABI47_0_0renderer/attributedstring/ParagraphAttributes.h>
#import <ABI47_0_0React/ABI47_0_0renderer/core/LayoutConstraints.h>
#import <ABI47_0_0React/ABI47_0_0renderer/graphics/Geometry.h>
#import <ABI47_0_0React/ABI47_0_0renderer/textlayoutmanager/TextMeasureCache.h>

NS_ASSUME_NONNULL_BEGIN

/**
 @abstract Enumeration block for text fragments.
*/

using ABI47_0_0RCTTextLayoutFragmentEnumerationBlock =
    void (^)(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value);

/**
 * iOS-specific TextLayoutManager
 */
@interface ABI47_0_0RCTTextLayoutManager : NSObject

- (ABI47_0_0facebook::ABI47_0_0React::TextMeasurement)measureAttributedString:(ABI47_0_0facebook::ABI47_0_0React::AttributedString)attributedString
                                        paragraphAttributes:(ABI47_0_0facebook::ABI47_0_0React::ParagraphAttributes)paragraphAttributes
                                          layoutConstraints:(ABI47_0_0facebook::ABI47_0_0React::LayoutConstraints)layoutConstraints;

- (ABI47_0_0facebook::ABI47_0_0React::TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                                          paragraphAttributes:(ABI47_0_0facebook::ABI47_0_0React::ParagraphAttributes)paragraphAttributes
                                            layoutConstraints:(ABI47_0_0facebook::ABI47_0_0React::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(ABI47_0_0facebook::ABI47_0_0React::AttributedString)attributedString
         paragraphAttributes:(ABI47_0_0facebook::ABI47_0_0React::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame;

- (ABI47_0_0facebook::ABI47_0_0React::LinesMeasurements)getLinesForAttributedString:(ABI47_0_0facebook::ABI47_0_0React::AttributedString)attributedString
                                              paragraphAttributes:
                                                  (ABI47_0_0facebook::ABI47_0_0React::ParagraphAttributes)paragraphAttributes
                                                             size:(CGSize)size;

- (ABI47_0_0facebook::ABI47_0_0React::SharedEventEmitter)
    getEventEmitterWithAttributeString:(ABI47_0_0facebook::ABI47_0_0React::AttributedString)attributedString
                   paragraphAttributes:(ABI47_0_0facebook::ABI47_0_0React::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

- (void)getRectWithAttributedString:(ABI47_0_0facebook::ABI47_0_0React::AttributedString)attributedString
                paragraphAttributes:(ABI47_0_0facebook::ABI47_0_0React::ParagraphAttributes)paragraphAttributes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(ABI47_0_0RCTTextLayoutFragmentEnumerationBlock)block;

@end

NS_ASSUME_NONNULL_END
