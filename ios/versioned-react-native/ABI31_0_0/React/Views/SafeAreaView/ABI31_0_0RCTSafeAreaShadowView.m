/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTSafeAreaShadowView.h"

#import <ReactABI31_0_0/ABI31_0_0RCTAssert.h>
#import <ABI31_0_0yoga/ABI31_0_0Yoga.h>

#import "ABI31_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI31_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI31_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI31_0_0RCTAssert([localData isKindOfClass:[ABI31_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI31_0_0RCTSafeAreaShadowView` must be `ABI31_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI31_0_0YGValue){insets.left, ABI31_0_0YGUnitPoint};
  super.paddingRight = (ABI31_0_0YGValue){insets.right, ABI31_0_0YGUnitPoint};
  super.paddingTop = (ABI31_0_0YGValue){insets.top, ABI31_0_0YGUnitPoint};
  super.paddingBottom = (ABI31_0_0YGValue){insets.bottom, ABI31_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI31_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI31_0_0YGValue)value {}
- (void)setPaddingRight:(ABI31_0_0YGValue)value {}
- (void)setPaddingTop:(ABI31_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI31_0_0YGValue)value {}

@end
