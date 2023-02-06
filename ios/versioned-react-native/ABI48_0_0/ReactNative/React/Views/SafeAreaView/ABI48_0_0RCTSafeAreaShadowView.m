/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTSafeAreaShadowView.h"

#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>
#import <ABI48_0_0yoga/ABI48_0_0Yoga.h>

#import "ABI48_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI48_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI48_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI48_0_0RCTAssert(
      [localData isKindOfClass:[ABI48_0_0RCTSafeAreaViewLocalData class]],
      @"Local data object for `ABI48_0_0RCTSafeAreaShadowView` must be `ABI48_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI48_0_0YGValue){insets.left, ABI48_0_0YGUnitPoint};
  super.paddingRight = (ABI48_0_0YGValue){insets.right, ABI48_0_0YGUnitPoint};
  super.paddingTop = (ABI48_0_0YGValue){insets.top, ABI48_0_0YGUnitPoint};
  super.paddingBottom = (ABI48_0_0YGValue){insets.bottom, ABI48_0_0YGUnitPoint};

  [self didSetProps:@[ @"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom" ]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(__unused ABI48_0_0YGValue)value
{
}
- (void)setPaddingLeft:(__unused ABI48_0_0YGValue)value
{
}
- (void)setPaddingRight:(__unused ABI48_0_0YGValue)value
{
}
- (void)setPaddingTop:(__unused ABI48_0_0YGValue)value
{
}
- (void)setPaddingBottom:(__unused ABI48_0_0YGValue)value
{
}

@end
