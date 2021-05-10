/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RCTSafeAreaShadowView.h"

#import <ABI40_0_0React/ABI40_0_0RCTAssert.h>
#import <ABI40_0_0yoga/ABI40_0_0Yoga.h>

#import "ABI40_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI40_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI40_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI40_0_0RCTAssert(
      [localData isKindOfClass:[ABI40_0_0RCTSafeAreaViewLocalData class]],
      @"Local data object for `ABI40_0_0RCTSafeAreaShadowView` must be `ABI40_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI40_0_0YGValue){insets.left, ABI40_0_0YGUnitPoint};
  super.paddingRight = (ABI40_0_0YGValue){insets.right, ABI40_0_0YGUnitPoint};
  super.paddingTop = (ABI40_0_0YGValue){insets.top, ABI40_0_0YGUnitPoint};
  super.paddingBottom = (ABI40_0_0YGValue){insets.bottom, ABI40_0_0YGUnitPoint};

  [self didSetProps:@[ @"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom" ]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(__unused ABI40_0_0YGValue)value
{
}
- (void)setPaddingLeft:(__unused ABI40_0_0YGValue)value
{
}
- (void)setPaddingRight:(__unused ABI40_0_0YGValue)value
{
}
- (void)setPaddingTop:(__unused ABI40_0_0YGValue)value
{
}
- (void)setPaddingBottom:(__unused ABI40_0_0YGValue)value
{
}

@end
