/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedString.h>
#import <ABI49_0_0React/renderer/attributedstring/ABI49_0_0ParagraphAttributes.h>
#import <ABI49_0_0React/renderer/textlayoutmanager/ABI49_0_0RCTTextLayoutManager.h>

#import "ABI49_0_0RCTParagraphComponentView.h"

@interface ABI49_0_0RCTParagraphComponentAccessibilityProvider : NSObject

- (instancetype)initWithString:(ABI49_0_0facebook::ABI49_0_0React::AttributedString)attributedString
                 layoutManager:(ABI49_0_0RCTTextLayoutManager *)layoutManager
           paragraphAttributes:(ABI49_0_0facebook::ABI49_0_0React::ParagraphAttributes)paragraphAttributes
                         frame:(CGRect)frame
                          view:(UIView *)view;

/*
 * Returns an array of `UIAccessibilityElement`s to be used for `UIAccessibilityContainer` implementation.
 */
- (NSArray<UIAccessibilityElement *> *)accessibilityElements;

/**
 @abstract To make sure the provider is up to date.
*/
- (BOOL)isUpToDate:(ABI49_0_0facebook::ABI49_0_0React::AttributedString)currentAttributedString;

@end
