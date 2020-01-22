/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI34_0_0/ABI34_0_0RCTShadowView.h>

#import "ABI34_0_0RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const ABI34_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface ABI34_0_0RCTBaseTextShadowView : ABI34_0_0RCTShadowView

@property (nonatomic, strong) ABI34_0_0RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI34_0_0RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
