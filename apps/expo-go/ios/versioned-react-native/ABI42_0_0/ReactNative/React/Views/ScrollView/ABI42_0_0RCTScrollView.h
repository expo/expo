/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIScrollView.h>

#import <ABI42_0_0React/ABI42_0_0RCTAutoInsetsProtocol.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTScrollableProtocol.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>

@protocol UIScrollViewDelegate;

@interface ABI42_0_0RCTScrollView : ABI42_0_0RCTView <UIScrollViewDelegate, ABI42_0_0RCTScrollableProtocol, ABI42_0_0RCTAutoInsetsProtocol>

- (instancetype)initWithEventDispatcher:(ABI42_0_0RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

/**
 * The `ABI42_0_0RCTScrollView` may have at most one single subview. This will ensure
 * that the scroll view's `contentSize` will be efficiently set to the size of
 * the single subview's frame. That frame size will be determined somewhat
 * efficiently since it will have already been computed by the off-main-thread
 * layout system.
 */
@property (nonatomic, readonly) UIView *contentView;

/**
 * If the `contentSize` is not specified (or is specified as {0, 0}, then the
 * `contentSize` will automatically be determined by the size of the subview.
 */
@property (nonatomic, assign) CGSize contentSize;

/**
 * The underlying scrollView (TODO: can we remove this?)
 */
@property (nonatomic, readonly) UIScrollView *scrollView;

@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, assign) BOOL DEPRECATED_sendUpdatedChildFrames;
@property (nonatomic, assign) NSTimeInterval scrollEventThrottle;
@property (nonatomic, assign) BOOL centerContent;
@property (nonatomic, copy) NSDictionary *maintainVisibleContentPosition;
@property (nonatomic, assign) BOOL scrollToOverflowEnabled;
@property (nonatomic, assign) int snapToInterval;
@property (nonatomic, assign) BOOL disableIntervalMomentum;
@property (nonatomic, copy) NSArray<NSNumber *> *snapToOffsets;
@property (nonatomic, assign) BOOL snapToStart;
@property (nonatomic, assign) BOOL snapToEnd;
@property (nonatomic, copy) NSString *snapToAlignment;
@property (nonatomic, assign) BOOL inverted;

// NOTE: currently these event props are only declared so we can export the
// event names to JS - we don't call the blocks directly because scroll events
// need to be coalesced before sending, for performance reasons.
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onScrollBeginDrag;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onScroll;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onScrollToTop;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onScrollEndDrag;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onMomentumScrollBegin;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onMomentumScrollEnd;

@end

@interface ABI42_0_0RCTScrollView (Internal)

- (void)updateContentOffsetIfNeeded;

@end

@interface ABI42_0_0RCTEventDispatcher (ABI42_0_0RCTScrollView)

/**
 * Send a fake scroll event.
 */
- (void)sendFakeScrollEvent:(NSNumber *)ABI42_0_0ReactTag;

@end
