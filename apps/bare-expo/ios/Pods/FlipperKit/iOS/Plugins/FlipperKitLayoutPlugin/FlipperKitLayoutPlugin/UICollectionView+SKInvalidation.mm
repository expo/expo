/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "UICollectionView+SKInvalidation.h"

#import "SKInvalidation.h"
#import "SKSwizzle.h"

FB_LINKABLE(UICollectionView_SKInvalidation)
@implementation UICollectionView (SKInvalidation)

+ (void)enableInvalidations {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    swizzleMethods(
        [self class],
        @selector(cellForItemAtIndexPath:),
        @selector(swizzle_cellForItemAtIndexPath:));
  });
}

- (UICollectionViewCell*)swizzle_cellForItemAtIndexPath:
    (NSIndexPath*)indexPath {
  dispatch_async(dispatch_get_main_queue(), ^{
    [[SKInvalidation sharedInstance].delegate invalidateNode:self];
  });

  return [self swizzle_cellForItemAtIndexPath:indexPath];
}

@end

#endif
