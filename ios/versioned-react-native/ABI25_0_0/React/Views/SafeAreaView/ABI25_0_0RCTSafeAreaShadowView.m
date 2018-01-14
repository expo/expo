/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTSafeAreaShadowView.h"

#import <ReactABI25_0_0/ABI25_0_0RCTAssert.h>
#import <YogaABI25_0_0/ABI25_0_0Yoga.h>

#import "ABI25_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI25_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI25_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI25_0_0RCTAssert([localData isKindOfClass:[ABI25_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI25_0_0RCTSafeAreaShadowView` must be `ABI25_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI25_0_0YGValue){insets.left, ABI25_0_0YGUnitPoint};
  super.paddingRight = (ABI25_0_0YGValue){insets.right, ABI25_0_0YGUnitPoint};
  super.paddingTop = (ABI25_0_0YGValue){insets.top, ABI25_0_0YGUnitPoint};
  super.paddingBottom = (ABI25_0_0YGValue){insets.bottom, ABI25_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI25_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI25_0_0YGValue)value {}
- (void)setPaddingRight:(ABI25_0_0YGValue)value {}
- (void)setPaddingTop:(ABI25_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI25_0_0YGValue)value {}

@end
