/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTSafeAreaShadowView.h"

#import <ABI38_0_0React/ABI38_0_0RCTAssert.h>
#import <ABI38_0_0yoga/ABI38_0_0Yoga.h>

#import "ABI38_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI38_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI38_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI38_0_0RCTAssert([localData isKindOfClass:[ABI38_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI38_0_0RCTSafeAreaShadowView` must be `ABI38_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI38_0_0YGValue){insets.left, ABI38_0_0YGUnitPoint};
  super.paddingRight = (ABI38_0_0YGValue){insets.right, ABI38_0_0YGUnitPoint};
  super.paddingTop = (ABI38_0_0YGValue){insets.top, ABI38_0_0YGUnitPoint};
  super.paddingBottom = (ABI38_0_0YGValue){insets.bottom, ABI38_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(__unused ABI38_0_0YGValue)value {}
- (void)setPaddingLeft:(__unused ABI38_0_0YGValue)value {}
- (void)setPaddingRight:(__unused ABI38_0_0YGValue)value {}
- (void)setPaddingTop:(__unused ABI38_0_0YGValue)value {}
- (void)setPaddingBottom:(__unused ABI38_0_0YGValue)value {}

@end
