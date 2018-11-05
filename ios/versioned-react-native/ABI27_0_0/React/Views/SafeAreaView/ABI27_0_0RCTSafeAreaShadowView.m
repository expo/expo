/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTSafeAreaShadowView.h"

#import <ReactABI27_0_0/ABI27_0_0RCTAssert.h>
#import <yogaABI27_0_0/ABI27_0_0yoga.h>

#import "ABI27_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI27_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI27_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI27_0_0RCTAssert([localData isKindOfClass:[ABI27_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI27_0_0RCTSafeAreaShadowView` must be `ABI27_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI27_0_0YGValue){insets.left, ABI27_0_0YGUnitPoint};
  super.paddingRight = (ABI27_0_0YGValue){insets.right, ABI27_0_0YGUnitPoint};
  super.paddingTop = (ABI27_0_0YGValue){insets.top, ABI27_0_0YGUnitPoint};
  super.paddingBottom = (ABI27_0_0YGValue){insets.bottom, ABI27_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI27_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI27_0_0YGValue)value {}
- (void)setPaddingRight:(ABI27_0_0YGValue)value {}
- (void)setPaddingTop:(ABI27_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI27_0_0YGValue)value {}

@end
