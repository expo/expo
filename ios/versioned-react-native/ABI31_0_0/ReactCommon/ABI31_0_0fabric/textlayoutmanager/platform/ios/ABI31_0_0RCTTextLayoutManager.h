/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI31_0_0fabric/ABI31_0_0core/LayoutConstraints.h>
#import <ABI31_0_0fabric/ABI31_0_0graphics/Geometry.h>
#import <ABI31_0_0fabric/ABI31_0_0attributedstring/AttributedString.h>
#import <ABI31_0_0fabric/ABI31_0_0attributedstring/ParagraphAttributes.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * iOS-specific TextLayoutManager
 */
@interface ABI31_0_0RCTTextLayoutManager : NSObject

- (facebook::ReactABI31_0_0::Size)measureWithAttributedString:(facebook::ReactABI31_0_0::AttributedString)attributedString
                                 paragraphAttributes:(facebook::ReactABI31_0_0::ParagraphAttributes)paragraphAttributes
                                   layoutConstraints:(facebook::ReactABI31_0_0::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(facebook::ReactABI31_0_0::AttributedString)attributedString
         paragraphAttributes:(facebook::ReactABI31_0_0::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame;

@end

NS_ASSUME_NONNULL_END
