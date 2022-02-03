/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTShadowView.h>

#import "ABI43_0_0RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const ABI43_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface ABI43_0_0RCTBaseTextShadowView : ABI43_0_0RCTShadowView {
  @protected NSAttributedString *_Nullable cachedAttributedText;
  @protected ABI43_0_0RCTTextAttributes *_Nullable cachedTextAttributes;
}

@property (nonatomic, strong) ABI43_0_0RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI43_0_0RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
