/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTSafeAreaShadowView.h"

#import <ReactABI33_0_0/ABI33_0_0RCTAssert.h>
#import <ABI33_0_0yoga/ABI33_0_0Yoga.h>

#import "ABI33_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI33_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI33_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI33_0_0RCTAssert([localData isKindOfClass:[ABI33_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI33_0_0RCTSafeAreaShadowView` must be `ABI33_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI33_0_0YGValue){insets.left, ABI33_0_0YGUnitPoint};
  super.paddingRight = (ABI33_0_0YGValue){insets.right, ABI33_0_0YGUnitPoint};
  super.paddingTop = (ABI33_0_0YGValue){insets.top, ABI33_0_0YGUnitPoint};
  super.paddingBottom = (ABI33_0_0YGValue){insets.bottom, ABI33_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI33_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI33_0_0YGValue)value {}
- (void)setPaddingRight:(ABI33_0_0YGValue)value {}
- (void)setPaddingTop:(ABI33_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI33_0_0YGValue)value {}

@end
