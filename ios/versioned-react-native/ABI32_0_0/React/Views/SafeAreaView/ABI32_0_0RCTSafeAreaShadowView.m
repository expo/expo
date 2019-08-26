/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTSafeAreaShadowView.h"

#import <ReactABI32_0_0/ABI32_0_0RCTAssert.h>
#import <ABI32_0_0yoga/ABI32_0_0Yoga.h>

#import "ABI32_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI32_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI32_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI32_0_0RCTAssert([localData isKindOfClass:[ABI32_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI32_0_0RCTSafeAreaShadowView` must be `ABI32_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI32_0_0YGValue){insets.left, ABI32_0_0YGUnitPoint};
  super.paddingRight = (ABI32_0_0YGValue){insets.right, ABI32_0_0YGUnitPoint};
  super.paddingTop = (ABI32_0_0YGValue){insets.top, ABI32_0_0YGUnitPoint};
  super.paddingBottom = (ABI32_0_0YGValue){insets.bottom, ABI32_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI32_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI32_0_0YGValue)value {}
- (void)setPaddingRight:(ABI32_0_0YGValue)value {}
- (void)setPaddingTop:(ABI32_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI32_0_0YGValue)value {}

@end
