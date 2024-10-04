/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0RCTLegacyViewManagerInteropComponentView : ABI48_0_0RCTViewComponentView

/**
 Returns true for components that are supported by LegacyViewManagerInterop layer, false otherwise.
 */
+ (BOOL)isSupported:(NSString *)componentName;

+ (void)supportLegacyViewManagerWithName:(NSString *)componentName;
+ (void)supportLegacyViewManagersWithPrefix:(NSString *)prefix;

@end

NS_ASSUME_NONNULL_END
