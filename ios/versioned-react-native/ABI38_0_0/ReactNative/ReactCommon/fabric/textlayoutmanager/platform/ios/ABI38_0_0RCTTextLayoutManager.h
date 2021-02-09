/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/attributedstring/AttributedString.h>
#import <ABI38_0_0React/attributedstring/ParagraphAttributes.h>
#import <ABI38_0_0React/core/LayoutConstraints.h>
#import <ABI38_0_0React/graphics/Geometry.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * iOS-specific TextLayoutManager
 */
@interface ABI38_0_0RCTTextLayoutManager : NSObject

- (ABI38_0_0facebook::ABI38_0_0React::Size)measureAttributedString:(ABI38_0_0facebook::ABI38_0_0React::AttributedString)attributedString
                             paragraphAttributes:(ABI38_0_0facebook::ABI38_0_0React::ParagraphAttributes)paragraphAttributes
                               layoutConstraints:(ABI38_0_0facebook::ABI38_0_0React::LayoutConstraints)layoutConstraints;

- (ABI38_0_0facebook::ABI38_0_0React::Size)measureNSAttributedString:(NSAttributedString *)attributedString
                               paragraphAttributes:(ABI38_0_0facebook::ABI38_0_0React::ParagraphAttributes)paragraphAttributes
                                 layoutConstraints:(ABI38_0_0facebook::ABI38_0_0React::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(ABI38_0_0facebook::ABI38_0_0React::AttributedString)attributedString
         paragraphAttributes:
             (ABI38_0_0facebook::ABI38_0_0React::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame;

- (ABI38_0_0facebook::ABI38_0_0React::SharedEventEmitter)
    getEventEmitterWithAttributeString:
        (ABI38_0_0facebook::ABI38_0_0React::AttributedString)attributedString
                   paragraphAttributes:
                       (ABI38_0_0facebook::ABI38_0_0React::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

@end

NS_ASSUME_NONNULL_END
