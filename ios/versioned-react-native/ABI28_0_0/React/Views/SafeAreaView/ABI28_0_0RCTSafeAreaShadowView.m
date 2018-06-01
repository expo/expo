/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTSafeAreaShadowView.h"

#import <ReactABI28_0_0/ABI28_0_0RCTAssert.h>
#import <YogaABI28_0_0/ABI28_0_0Yoga.h>

#import "ABI28_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI28_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI28_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI28_0_0RCTAssert([localData isKindOfClass:[ABI28_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI28_0_0RCTSafeAreaShadowView` must be `ABI28_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI28_0_0YGValue){insets.left, ABI28_0_0YGUnitPoint};
  super.paddingRight = (ABI28_0_0YGValue){insets.right, ABI28_0_0YGUnitPoint};
  super.paddingTop = (ABI28_0_0YGValue){insets.top, ABI28_0_0YGUnitPoint};
  super.paddingBottom = (ABI28_0_0YGValue){insets.bottom, ABI28_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI28_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI28_0_0YGValue)value {}
- (void)setPaddingRight:(ABI28_0_0YGValue)value {}
- (void)setPaddingTop:(ABI28_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI28_0_0YGValue)value {}

@end
