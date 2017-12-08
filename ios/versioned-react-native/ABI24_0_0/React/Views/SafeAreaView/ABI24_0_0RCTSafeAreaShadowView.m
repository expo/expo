/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTSafeAreaShadowView.h"

#import <ReactABI24_0_0/ABI24_0_0RCTAssert.h>
#import <yogaABI24_0_0/ABI24_0_0Yoga.h>

#import "ABI24_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI24_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI24_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI24_0_0RCTAssert([localData isKindOfClass:[ABI24_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI24_0_0RCTSafeAreaShadowView` must be `ABI24_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI24_0_0YGValue){insets.left, ABI24_0_0YGUnitPoint};
  super.paddingRight = (ABI24_0_0YGValue){insets.right, ABI24_0_0YGUnitPoint};
  super.paddingTop = (ABI24_0_0YGValue){insets.top, ABI24_0_0YGUnitPoint};
  super.paddingBottom = (ABI24_0_0YGValue){insets.bottom, ABI24_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI24_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI24_0_0YGValue)value {}
- (void)setPaddingRight:(ABI24_0_0YGValue)value {}
- (void)setPaddingTop:(ABI24_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI24_0_0YGValue)value {}

@end
