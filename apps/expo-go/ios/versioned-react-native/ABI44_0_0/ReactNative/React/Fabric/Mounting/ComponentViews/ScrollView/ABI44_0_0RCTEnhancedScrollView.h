/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTGenericDelegateSplitter.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Many `UIScrollView` customizations normally require creating a subclass which is not always convenient.
 * `ABI44_0_0RCTEnhancedScrollView` has a delegate (conforming to this protocol) that allows customizing such behaviors without
 * creating a subclass.
 */
@protocol ABI44_0_0RCTEnhancedScrollViewOverridingDelegate <NSObject>

- (BOOL)touchesShouldCancelInContentView:(UIView *)view;

@end

/*
 * `UIScrollView` subclass which has some improvements and tweaks
 * which are not directly related to ABI44_0_0React Native.
 */
@interface ABI44_0_0RCTEnhancedScrollView : UIScrollView

/*
 * Returns a delegate splitter that can be used to create as many `UIScrollView` delegates as needed.
 * Use that instead of accessing `delegate` property directly.
 *
 * This class overrides the `delegate` property and wires that to the delegate splitter.
 *
 * We never know which another part of the app might introspect the view hierarchy and mess with `UIScrollView`'s
 * delegate, so we expose a fake delegate connected to the original one via the splitter to make the component as
 * resilient to other code as possible: even if something else nil the delegate, other delegates that were subscribed
 * via the splitter will continue working.
 */
@property (nonatomic, strong, readonly) ABI44_0_0RCTGenericDelegateSplitter<id<UIScrollViewDelegate>> *delegateSplitter;

@property (nonatomic, weak) id<ABI44_0_0RCTEnhancedScrollViewOverridingDelegate> overridingDelegate;
@property (nonatomic, assign) BOOL pinchGestureEnabled;
@property (nonatomic, assign) BOOL centerContent;
@property (nonatomic, assign) CGFloat snapToInterval;
@property (nonatomic, copy) NSString *snapToAlignment;
@property (nonatomic, assign) BOOL disableIntervalMomentum;
@property (nonatomic, assign) BOOL snapToStart;
@property (nonatomic, assign) BOOL snapToEnd;
@property (nonatomic, copy) NSArray<NSNumber *> *snapToOffsets;

@end

NS_ASSUME_NONNULL_END
