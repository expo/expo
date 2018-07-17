/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTSafeAreaShadowView.h"

#import <ReactABI29_0_0/ABI29_0_0RCTAssert.h>
#import <ABI29_0_0yoga/ABI29_0_0Yoga.h>

#import "ABI29_0_0RCTSafeAreaViewLocalData.h"

@implementation ABI29_0_0RCTSafeAreaShadowView

- (void)setLocalData:(ABI29_0_0RCTSafeAreaViewLocalData *)localData
{
  ABI29_0_0RCTAssert([localData isKindOfClass:[ABI29_0_0RCTSafeAreaViewLocalData class]],
    @"Local data object for `ABI29_0_0RCTSafeAreaShadowView` must be `ABI29_0_0RCTSafeAreaViewLocalData` instance.");

  UIEdgeInsets insets = localData.insets;

  super.paddingLeft = (ABI29_0_0YGValue){insets.left, ABI29_0_0YGUnitPoint};
  super.paddingRight = (ABI29_0_0YGValue){insets.right, ABI29_0_0YGUnitPoint};
  super.paddingTop = (ABI29_0_0YGValue){insets.top, ABI29_0_0YGUnitPoint};
  super.paddingBottom = (ABI29_0_0YGValue){insets.bottom, ABI29_0_0YGUnitPoint};

  [self didSetProps:@[@"paddingLeft", @"paddingRight", @"paddingTop", @"paddingBottom"]];
}

/**
 * Removing support for setting padding from any outside code
 * to prevent interferring this with local data.
 */
- (void)setPadding:(ABI29_0_0YGValue)value {}
- (void)setPaddingLeft:(ABI29_0_0YGValue)value {}
- (void)setPaddingRight:(ABI29_0_0YGValue)value {}
- (void)setPaddingTop:(ABI29_0_0YGValue)value {}
- (void)setPaddingBottom:(ABI29_0_0YGValue)value {}

@end
