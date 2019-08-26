/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI31_0_0/ABI31_0_0RCTShadowView.h>

#import "ABI31_0_0RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const ABI31_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface ABI31_0_0RCTBaseTextShadowView : ABI31_0_0RCTShadowView

@property (nonatomic, strong) ABI31_0_0RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI31_0_0RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
