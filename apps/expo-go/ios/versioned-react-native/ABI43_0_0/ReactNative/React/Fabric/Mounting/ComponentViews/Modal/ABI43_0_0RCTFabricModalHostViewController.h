/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol ABI43_0_0RCTFabricModalHostViewControllerDelegate <NSObject>
- (void)boundsDidChange:(CGRect)newBounds;
@end

@interface ABI43_0_0RCTFabricModalHostViewController : UIViewController

@property (nonatomic, weak) id<ABI43_0_0RCTFabricModalHostViewControllerDelegate> delegate;

@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;

@end
