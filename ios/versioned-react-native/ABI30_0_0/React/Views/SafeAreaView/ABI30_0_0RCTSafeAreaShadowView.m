/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTSafeAreaShadowView.h"

#import <ReactABI30_0_0/ABI30_0_0RCTAssert.h>
#import <ABI30_0_0yoga/ABI30_0_0Yoga.h>

#import "ABI30_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI30_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI30_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI30_0_0RCTAssert([localData isKindOfClass:[ABI30_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI30_0_0RCTSafeAreaShadowView` must be `ABI30_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI30_0_0YGValue){insets.left, ABI30_0_0YGUnitPoint};
  super.paddingRight = (ABI30_0_0YGValue){insets.right, ABI30_0_0YGUnitPoint};
  super.paddingTop = (ABI30_0_0YGValue){insets.top, ABI30_0_0YGUnitPoint};
  super.paddingBottom = (ABI30_0_0YGValue){insets.bottom, ABI30_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI30_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI30_0_0YGValue)value {}
- (void)setPaddingRight:(ABI30_0_0YGValue)value {}
- (void)setPaddingTop:(ABI30_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI30_0_0YGValue)value {}

@end
