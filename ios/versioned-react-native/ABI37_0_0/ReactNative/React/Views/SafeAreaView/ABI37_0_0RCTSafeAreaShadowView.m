/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTSafeAreaShadowView.h"

#import <ABI37_0_0React/ABI37_0_0RCTAssert.h>
#import <ABI37_0_0yoga/ABI37_0_0Yoga.h>

#import "ABI37_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI37_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI37_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI37_0_0RCTAssert([localData isKindOfClass:[ABI37_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI37_0_0RCTSafeAreaShadowView` must be `ABI37_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI37_0_0YGValue){insets.left, ABI37_0_0YGUnitPoint};
  super.paddingRight = (ABI37_0_0YGValue){insets.right, ABI37_0_0YGUnitPoint};
  super.paddingTop = (ABI37_0_0YGValue){insets.top, ABI37_0_0YGUnitPoint};
  super.paddingBottom = (ABI37_0_0YGValue){insets.bottom, ABI37_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(__unused ABI37_0_0YGValue)value {}
- (void)setPaddingLeft:(__unused ABI37_0_0YGValue)value {}
- (void)setPaddingRight:(__unused ABI37_0_0YGValue)value {}
- (void)setPaddingTop:(__unused ABI37_0_0YGValue)value {}
- (void)setPaddingBottom:(__unused ABI37_0_0YGValue)value {}

@end
