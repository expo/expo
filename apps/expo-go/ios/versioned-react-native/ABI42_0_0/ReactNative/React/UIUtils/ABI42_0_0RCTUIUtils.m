/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTUIUtils.h"

#import "ABI42_0_0RCTUtils.h"

ABI42_0_0RCTDimensions ABI42_0_0RCTGetDimensions(CGFloat fontScale)
{
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;

  UIView *mainWindow;
  mainWindow = ABI42_0_0RCTKeyWindow();
  CGSize windowSize = mainWindow.bounds.size;

  ABI42_0_0RCTDimensions result;
  typeof(result.screen) dimsScreen = {
      .width = screenSize.width, .height = screenSize.height, .scale = mainScreen.scale, .fontScale = fontScale};
  typeof(result.window) dimsWindow = {
      .width = windowSize.width, .height = windowSize.height, .scale = mainScreen.scale, .fontScale = fontScale};
  result.screen = dimsScreen;
  result.window = dimsWindow;

  return result;
}

CGFloat ABI42_0_0RCTGetMultiplierForContentSizeCategory(UIContentSizeCategory category)
{
  static NSDictionary<NSString *, NSNumber *> *multipliers = nil;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    multipliers = @{
      UIContentSizeCategoryExtraSmall : @0.823,
      UIContentSizeCategorySmall : @0.882,
      UIContentSizeCategoryMedium : @0.941,
      UIContentSizeCategoryLarge : @1.0,
      UIContentSizeCategoryExtraLarge : @1.118,
      UIContentSizeCategoryExtraExtraLarge : @1.235,
      UIContentSizeCategoryExtraExtraExtraLarge : @1.353,
      UIContentSizeCategoryAccessibilityMedium : @1.786,
      UIContentSizeCategoryAccessibilityLarge : @2.143,
      UIContentSizeCategoryAccessibilityExtraLarge : @2.643,
      UIContentSizeCategoryAccessibilityExtraExtraLarge : @3.143,
      UIContentSizeCategoryAccessibilityExtraExtraExtraLarge : @3.571
    };
  });

  double value = multipliers[category].doubleValue;
  return value > 0.0 ? value : 1.0;
}
