/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTShadowView.h>

#import "ABI47_0_0RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const ABI47_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface ABI47_0_0RCTBaseTextShadowView : ABI47_0_0RCTShadowView {
  @protected NSAttributedString *_Nullable cachedAttributedText;
  @protected ABI47_0_0RCTTextAttributes *_Nullable cachedTextAttributes;
}

@property (nonatomic, strong) ABI47_0_0RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI47_0_0RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
