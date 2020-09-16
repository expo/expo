/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTShadowView.h>

#import "ABI39_0_0RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const ABI39_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface ABI39_0_0RCTBaseTextShadowView : ABI39_0_0RCTShadowView {
  @protected NSAttributedString *_Nullable cachedAttributedText;
  @protected ABI39_0_0RCTTextAttributes *_Nullable cachedTextAttributes;
}

@property (nonatomic, strong) ABI39_0_0RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI39_0_0RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
