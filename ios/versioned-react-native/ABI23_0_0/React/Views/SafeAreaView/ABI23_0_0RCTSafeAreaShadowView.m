/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTSafeAreaShadowView.h"

#import <ReactABI23_0_0/ABI23_0_0RCTAssert.h>
#import <YogaABI23_0_0/ABI23_0_0Yoga.h>

#import "ABI23_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI23_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI23_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI23_0_0RCTAssert([localData isKindOfClass:[ABI23_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI23_0_0RCTSafeAreaShadowView` must be `ABI23_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI23_0_0YGValue){insets.left, ABI23_0_0YGUnitPoint};
  super.paddingRight = (ABI23_0_0YGValue){insets.right, ABI23_0_0YGUnitPoint};
  super.paddingTop = (ABI23_0_0YGValue){insets.top, ABI23_0_0YGUnitPoint};
  super.paddingBottom = (ABI23_0_0YGValue){insets.bottom, ABI23_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI23_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI23_0_0YGValue)value {}
- (void)setPaddingRight:(ABI23_0_0YGValue)value {}
- (void)setPaddingTop:(ABI23_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI23_0_0YGValue)value {}

@end
