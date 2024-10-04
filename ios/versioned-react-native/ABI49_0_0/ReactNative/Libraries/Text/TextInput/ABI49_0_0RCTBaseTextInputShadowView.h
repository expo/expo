/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTBaseTextShadowView.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0RCTBaseTextInputShadowView : ABI49_0_0RCTBaseTextShadowView

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge;

@property (nonatomic, copy, nullable) NSString *text;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, assign) NSInteger maximumNumberOfLines;
@property (nonatomic, copy, nullable) ABI49_0_0RCTDirectEventBlock onContentSizeChange;

- (void)uiManagerWillPerformMounting;

@end

NS_ASSUME_NONNULL_END
