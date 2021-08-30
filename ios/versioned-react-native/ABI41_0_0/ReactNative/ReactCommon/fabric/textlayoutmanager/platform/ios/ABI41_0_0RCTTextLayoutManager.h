/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/attributedstring/AttributedString.h>
#import <ABI41_0_0React/attributedstring/ParagraphAttributes.h>
#import <ABI41_0_0React/core/LayoutConstraints.h>
#import <ABI41_0_0React/graphics/Geometry.h>
#import <ABI41_0_0React/textlayoutmanager/TextMeasureCache.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * iOS-specific TextLayoutManager
 */
@interface ABI41_0_0RCTTextLayoutManager : NSObject

- (ABI41_0_0facebook::ABI41_0_0React::TextMeasurement)measureAttributedString:(ABI41_0_0facebook::ABI41_0_0React::AttributedString)attributedString
                                        paragraphAttributes:(ABI41_0_0facebook::ABI41_0_0React::ParagraphAttributes)paragraphAttributes
                                          layoutConstraints:(ABI41_0_0facebook::ABI41_0_0React::LayoutConstraints)layoutConstraints;

- (ABI41_0_0facebook::ABI41_0_0React::TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                                          paragraphAttributes:(ABI41_0_0facebook::ABI41_0_0React::ParagraphAttributes)paragraphAttributes
                                            layoutConstraints:(ABI41_0_0facebook::ABI41_0_0React::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(ABI41_0_0facebook::ABI41_0_0React::AttributedString)attributedString
         paragraphAttributes:(ABI41_0_0facebook::ABI41_0_0React::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame;

- (ABI41_0_0facebook::ABI41_0_0React::SharedEventEmitter)
    getEventEmitterWithAttributeString:(ABI41_0_0facebook::ABI41_0_0React::AttributedString)attributedString
                   paragraphAttributes:(ABI41_0_0facebook::ABI41_0_0React::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

@end

NS_ASSUME_NONNULL_END
