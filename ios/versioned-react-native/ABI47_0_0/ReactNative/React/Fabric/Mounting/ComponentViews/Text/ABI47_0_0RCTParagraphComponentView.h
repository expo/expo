/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * UIView class for <Paragraph> component.
 */
@interface ABI47_0_0RCTParagraphComponentView : ABI47_0_0RCTViewComponentView

/*
 * Returns an `NSAttributedString` representing the content of the component.
 * To be only used by external introspection and debug tools.
 */
@property (nonatomic, nullable, readonly) NSAttributedString *attributedText;

@end

NS_ASSUME_NONNULL_END
