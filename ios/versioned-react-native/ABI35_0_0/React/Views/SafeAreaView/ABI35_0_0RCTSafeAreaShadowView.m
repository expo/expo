/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTSafeAreaShadowView.h"

#import <ReactABI35_0_0/ABI35_0_0RCTAssert.h>
#import <ABI35_0_0yoga/ABI35_0_0Yoga.h>

#import "ABI35_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI35_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI35_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI35_0_0RCTAssert([localData isKindOfClass:[ABI35_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI35_0_0RCTSafeAreaShadowView` must be `ABI35_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI35_0_0YGValue){insets.left, ABI35_0_0YGUnitPoint};
  super.paddingRight = (ABI35_0_0YGValue){insets.right, ABI35_0_0YGUnitPoint};
  super.paddingTop = (ABI35_0_0YGValue){insets.top, ABI35_0_0YGUnitPoint};
  super.paddingBottom = (ABI35_0_0YGValue){insets.bottom, ABI35_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI35_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI35_0_0YGValue)value {}
- (void)setPaddingRight:(ABI35_0_0YGValue)value {}
- (void)setPaddingTop:(ABI35_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI35_0_0YGValue)value {}

@end
