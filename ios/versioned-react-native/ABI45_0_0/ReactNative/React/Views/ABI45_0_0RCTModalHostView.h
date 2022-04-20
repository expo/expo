/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI45_0_0React/ABI45_0_0RCTInvalidating.h>
#import <ABI45_0_0React/ABI45_0_0RCTModalHostViewManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTView.h>

@class ABI45_0_0RCTBridge;
@class ABI45_0_0RCTModalHostViewController;

@protocol ABI45_0_0RCTModalHostViewInteractor;

@interface ABI45_0_0RCTModalHostView : UIView <ABI45_0_0RCTInvalidating, UIAdaptivePresentationControllerDelegate>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign) UIModalPresentationStyle presentationStyle;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onShow;
@property (nonatomic, assign) BOOL visible;

// Android only
@property (nonatomic, assign) BOOL statusBarTranslucent;
@property (nonatomic, assign) BOOL hardwareAccelerated;
@property (nonatomic, assign) BOOL animated;

@property (nonatomic, copy) NSNumber *identifier;

@property (nonatomic, weak) id<ABI45_0_0RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onOrientationChange;

// Fabric only
@property (nonatomic, copy) ABI45_0_0RCTBubblingEventBlock onDismiss;

- (instancetype)initWithBridge:(ABI45_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol ABI45_0_0RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(ABI45_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI45_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated;
- (void)dismissModalHostView:(ABI45_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI45_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated;

@end
