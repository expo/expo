/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTSafeAreaShadowView.h"

#import <ReactABI26_0_0/ABI26_0_0RCTAssert.h>
#import <YogaABI26_0_0/ABI26_0_0Yoga.h>

#import "ABI26_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI26_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI26_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI26_0_0RCTAssert([localData isKindOfClass:[ABI26_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI26_0_0RCTSafeAreaShadowView` must be `ABI26_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI26_0_0YGValue){insets.left, ABI26_0_0YGUnitPoint};
  super.paddingRight = (ABI26_0_0YGValue){insets.right, ABI26_0_0YGUnitPoint};
  super.paddingTop = (ABI26_0_0YGValue){insets.top, ABI26_0_0YGUnitPoint};
  super.paddingBottom = (ABI26_0_0YGValue){insets.bottom, ABI26_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI26_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI26_0_0YGValue)value {}
- (void)setPaddingRight:(ABI26_0_0YGValue)value {}
- (void)setPaddingTop:(ABI26_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI26_0_0YGValue)value {}

@end
