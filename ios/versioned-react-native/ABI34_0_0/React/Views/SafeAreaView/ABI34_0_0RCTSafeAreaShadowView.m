/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTSafeAreaShadowView.h"

#import <ReactABI34_0_0/ABI34_0_0RCTAssert.h>
#import <ABI34_0_0yoga/ABI34_0_0Yoga.h>

#import "ABI34_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI34_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI34_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI34_0_0RCTAssert([localData isKindOfClass:[ABI34_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI34_0_0RCTSafeAreaShadowView` must be `ABI34_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI34_0_0YGValue){insets.left, ABI34_0_0YGUnitPoint};
  super.paddingRight = (ABI34_0_0YGValue){insets.right, ABI34_0_0YGUnitPoint};
  super.paddingTop = (ABI34_0_0YGValue){insets.top, ABI34_0_0YGUnitPoint};
  super.paddingBottom = (ABI34_0_0YGValue){insets.bottom, ABI34_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI34_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI34_0_0YGValue)value {}
- (void)setPaddingRight:(ABI34_0_0YGValue)value {}
- (void)setPaddingTop:(ABI34_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI34_0_0YGValue)value {}

@end
