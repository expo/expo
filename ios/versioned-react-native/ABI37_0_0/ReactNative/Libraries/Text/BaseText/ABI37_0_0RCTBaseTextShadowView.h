/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTShadowView.h>

#import "ABI37_0_0RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const ABI37_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface ABI37_0_0RCTBaseTextShadowView : ABI37_0_0RCTShadowView {
  @protected NSAttributedString *_Nullable cachedAttributedText;
  @protected ABI37_0_0RCTTextAttributes *_Nullable cachedTextAttributes;
}

@property (nonatomic, strong) ABI37_0_0RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI37_0_0RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
