/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTView.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI43_0_0RCTBridge;

@interface ABI43_0_0RCTSafeAreaView : ABI43_0_0RCTView

- (instancetype)initWithBridge:(ABI43_0_0RCTBridge *)bridge;

@property (nonatomic, assign) BOOL emulateUnlessSupported;

@end

NS_ASSUME_NONNULL_END
