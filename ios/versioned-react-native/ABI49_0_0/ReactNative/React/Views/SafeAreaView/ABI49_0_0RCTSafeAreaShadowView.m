/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTSafeAreaShadowView.h"

#import <ABI49_0_0React/ABI49_0_0RCTAssert.h>
#import <ABI49_0_0yoga/ABI49_0_0Yoga.h>

#import "ABI49_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI49_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI49_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI49_0_0RCTAssert(
      [localData isKindOfClass:[ABI49_0_0RCTSafeAreaViewLocalData class]],
      @"Local data object for `ABI49_0_0RCTSafeAreaShadowView` must be `ABI49_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI49_0_0YGValue){insets.left, ABI49_0_0YGUnitPoint};
  super.paddingRight = (ABI49_0_0YGValue){insets.right, ABI49_0_0YGUnitPoint};
  super.paddingTop = (ABI49_0_0YGValue){insets.top, ABI49_0_0YGUnitPoint};
  super.paddingBottom = (ABI49_0_0YGValue){insets.bottom, ABI49_0_0YGUnitPoint};

  [self didSetProps:@[ @"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom" ]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interfering this with local data.
 */
- (void)setPadding:(__unused ABI49_0_0YGValue)value
{
}
- (void)setPaddingLeft:(__unused ABI49_0_0YGValue)value
{
}
- (void)setPaddingRight:(__unused ABI49_0_0YGValue)value
{
}
- (void)setPaddingTop:(__unused ABI49_0_0YGValue)value
{
}
- (void)setPaddingBottom:(__unused ABI49_0_0YGValue)value
{
}

@end
