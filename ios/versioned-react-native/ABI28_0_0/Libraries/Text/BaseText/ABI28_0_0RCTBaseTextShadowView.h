/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI28_0_0/ABI28_0_0RCTShadowView.h>

#import "ABI28_0_0RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const ABI28_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface ABI28_0_0RCTBaseTextShadowView : ABI28_0_0RCTShadowView

@property (nonatomic, strong) ABI28_0_0RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI28_0_0RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
