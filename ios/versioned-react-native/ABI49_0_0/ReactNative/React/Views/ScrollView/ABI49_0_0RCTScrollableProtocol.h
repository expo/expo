/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTComponent.h>
#import <UIKit/UIKit.h>

/**
 * Contains any methods related to scrolling. Any `ABI49_0_0RCTView` that has scrolling
 * features should implement these methods.
 */
@protocol ABI49_0_0RCTScrollableProtocol

@property (nonatomic, readonly) CGSize contentSize;

- (void)scrollToOffset:(CGPoint)offset;
- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated;
/**
 * If this is a vertical scroll view, scrolls to the bottom.
 * If this is a horizontal scroll view, scrolls to the right.
 */
- (void)scrollToEnd:(BOOL)animated;
- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated;

- (void)addScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener;
- (void)removeScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener;

@end

/**
 * Denotes a view which implements custom pull to refresh functionality.
 */
@protocol ABI49_0_0RCTCustomRefreshControlProtocol

@property (nonatomic, copy) ABI49_0_0RCTDirectEventBlock onRefresh;
@property (nonatomic, readonly, getter=isRefreshing) BOOL refreshing;

@optional
@property (nonatomic, weak) UIScrollView *scrollView;

@end

__attribute__((deprecated("Use ABI49_0_0RCTCustomRefreshControlProtocol instead")))
@protocol ABI49_0_0RCTCustomRefreshContolProtocol<ABI49_0_0RCTCustomRefreshControlProtocol>
@end
