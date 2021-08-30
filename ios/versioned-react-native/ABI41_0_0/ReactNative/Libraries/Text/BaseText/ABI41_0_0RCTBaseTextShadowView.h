/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTShadowView.h>

#import "ABI41_0_0RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const ABI41_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface ABI41_0_0RCTBaseTextShadowView : ABI41_0_0RCTShadowView {
  @protected NSAttributedString *_Nullable cachedAttributedText;
  @protected ABI41_0_0RCTTextAttributes *_Nullable cachedTextAttributes;
}

@property (nonatomic, strong) ABI41_0_0RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI41_0_0RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
