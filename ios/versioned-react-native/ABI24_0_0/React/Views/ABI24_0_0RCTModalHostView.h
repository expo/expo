/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI24_0_0/ABI24_0_0RCTInvalidating.h>
#import <ReactABI24_0_0/ABI24_0_0RCTModalHostViewManager.h>
#import <ReactABI24_0_0/ABI24_0_0RCTView.h>

@class ABI24_0_0RCTBridge;
@class ABI24_0_0RCTModalHostViewController;

@protocol ABI24_0_0RCTModalHostViewInteractor;

@interface ABI24_0_0RCTModalHostView : UIView <ABI24_0_0RCTInvalidating>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign) UIModalPresentationStyle presentationStyle;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI24_0_0RCTDirectEventBlock onShow;

@property (nonatomic, copy) NSNumber *identifier;

@property (nonatomic, weak) id<ABI24_0_0RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) ABI24_0_0RCTDirectEventBlock onOrientationChange;

#if TARGET_OS_TV
@property (nonatomic, copy) ABI24_0_0RCTDirectEventBlock onRequestClose;
#endif

- (instancetype)initWithBridge:(ABI24_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol ABI24_0_0RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(ABI24_0_0RCTModalHostView *)modalHostView withViewController:(ABI24_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;
- (void)dismissModalHostView:(ABI24_0_0RCTModalHostView *)modalHostView withViewController:(ABI24_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;

@end
