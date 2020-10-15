/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <FlipperKit/SKMacros.h>

FB_LINK_REQUIRE_CATEGORY(UICollectionView_SKInvalidation)
@interface UICollectionView (SKInvalidation)

+ (void)enableInvalidations;

@end
