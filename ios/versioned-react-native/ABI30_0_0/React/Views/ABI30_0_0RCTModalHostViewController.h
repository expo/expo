/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@interface ABI30_0_0RCTModalHostViewController : UIViewController

@property (nonatomic, copy) void (^boundsDidChangeBlock)(CGRect newBounds);

#if !TARGET_OS_TV
@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;
#endif

@end
