/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/attributedstring/AttributedString.h>
#import <ABI42_0_0React/attributedstring/ParagraphAttributes.h>
#import <ABI42_0_0React/core/LayoutConstraints.h>
#import <ABI42_0_0React/graphics/Geometry.h>
#import <ABI42_0_0React/textlayoutmanager/TextMeasureCache.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * iOS-specific TextLayoutManager
 */
@interface ABI42_0_0RCTTextLayoutManager : NSObject

- (ABI42_0_0facebook::ABI42_0_0React::TextMeasurement)measureAttributedString:(ABI42_0_0facebook::ABI42_0_0React::AttributedString)attributedString
                                        paragraphAttributes:(ABI42_0_0facebook::ABI42_0_0React::ParagraphAttributes)paragraphAttributes
                                          layoutConstraints:(ABI42_0_0facebook::ABI42_0_0React::LayoutConstraints)layoutConstraints;

- (ABI42_0_0facebook::ABI42_0_0React::TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                                          paragraphAttributes:(ABI42_0_0facebook::ABI42_0_0React::ParagraphAttributes)paragraphAttributes
                                            layoutConstraints:(ABI42_0_0facebook::ABI42_0_0React::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(ABI42_0_0facebook::ABI42_0_0React::AttributedString)attributedString
         paragraphAttributes:(ABI42_0_0facebook::ABI42_0_0React::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame;

- (ABI42_0_0facebook::ABI42_0_0React::SharedEventEmitter)
    getEventEmitterWithAttributeString:(ABI42_0_0facebook::ABI42_0_0React::AttributedString)attributedString
                   paragraphAttributes:(ABI42_0_0facebook::ABI42_0_0React::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

@end

NS_ASSUME_NONNULL_END
