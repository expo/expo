/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTInvalidating.h>
#import <ABI38_0_0React/ABI38_0_0RCTModalHostViewManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTView.h>

@class ABI38_0_0RCTBridge;
@class ABI38_0_0RCTModalHostViewController;
@class ABI38_0_0RCTTVRemoteHandler;

@protocol ABI38_0_0RCTModalHostViewInteractor;

@interface ABI38_0_0RCTModalHostView : UIView <ABI38_0_0RCTInvalidating>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign) UIModalPresentationStyle presentationStyle;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI38_0_0RCTDirectEventBlock onShow;

@property (nonatomic, copy) NSNumber *identifier;

@property (nonatomic, weak) id<ABI38_0_0RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) ABI38_0_0RCTDirectEventBlock onOrientationChange;

#if TARGET_OS_TV
@property (nonatomic, copy) ABI38_0_0RCTDirectEventBlock onRequestClose;
@property (nonatomic, strong) ABI38_0_0RCTTVRemoteHandler *tvRemoteHandler;
#endif

- (instancetype)initWithBridge:(ABI38_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol ABI38_0_0RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(ABI38_0_0RCTModalHostView *)modalHostView withViewController:(ABI38_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;
- (void)dismissModalHostView:(ABI38_0_0RCTModalHostView *)modalHostView withViewController:(ABI38_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;

@end
