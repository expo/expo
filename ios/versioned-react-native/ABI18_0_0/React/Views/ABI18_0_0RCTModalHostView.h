/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI18_0_0/ABI18_0_0RCTInvalidating.h>
#import <ReactABI18_0_0/ABI18_0_0RCTModalHostViewManager.h>
#import <ReactABI18_0_0/ABI18_0_0RCTView.h>

@class ABI18_0_0RCTBridge;
@class ABI18_0_0RCTModalHostViewController;

@protocol ABI18_0_0RCTModalHostViewInteractor;

@interface ABI18_0_0RCTModalHostView : UIView <ABI18_0_0RCTInvalidating>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI18_0_0RCTDirectEventBlock onShow;

@property (nonatomic, weak) id<ABI18_0_0RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) ABI18_0_0RCTDirectEventBlock onOrientationChange;

- (instancetype)initWithBridge:(ABI18_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol ABI18_0_0RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(ABI18_0_0RCTModalHostView *)modalHostView withViewController:(ABI18_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;
- (void)dismissModalHostView:(ABI18_0_0RCTModalHostView *)modalHostView withViewController:(ABI18_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;

@end
