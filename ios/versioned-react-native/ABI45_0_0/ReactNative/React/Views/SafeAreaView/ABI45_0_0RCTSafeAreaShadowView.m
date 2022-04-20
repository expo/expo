/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTSafeAreaShadowView.h"

#import <ABI45_0_0React/ABI45_0_0RCTAssert.h>
#import <ABI45_0_0yoga/ABI45_0_0Yoga.h>

#import "ABI45_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI45_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI45_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI45_0_0RCTAssert(
      [localData isKindOfClass:[ABI45_0_0RCTSafeAreaViewLocalData class]],
      @"Local data object for `ABI45_0_0RCTSafeAreaShadowView` must be `ABI45_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI45_0_0YGValue){insets.left, ABI45_0_0YGUnitPoint};
  super.paddingRight = (ABI45_0_0YGValue){insets.right, ABI45_0_0YGUnitPoint};
  super.paddingTop = (ABI45_0_0YGValue){insets.top, ABI45_0_0YGUnitPoint};
  super.paddingBottom = (ABI45_0_0YGValue){insets.bottom, ABI45_0_0YGUnitPoint};

  [self didSetProps:@[ @"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom" ]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(__unused ABI45_0_0YGValue)value
{
}
- (void)setPaddingLeft:(__unused ABI45_0_0YGValue)value
{
}
- (void)setPaddingRight:(__unused ABI45_0_0YGValue)value
{
}
- (void)setPaddingTop:(__unused ABI45_0_0YGValue)value
{
}
- (void)setPaddingBottom:(__unused ABI45_0_0YGValue)value
{
}

@end
