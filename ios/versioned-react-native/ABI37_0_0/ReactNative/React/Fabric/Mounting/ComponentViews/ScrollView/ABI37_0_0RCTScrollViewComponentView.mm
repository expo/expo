/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTScrollViewComponentView.h"

#import <ABI37_0_0React/ABI37_0_0RCTAssert.h>

#import <ABI37_0_0React/components/scrollview/ScrollViewComponentDescriptor.h>
#import <ABI37_0_0React/components/scrollview/ScrollViewEventEmitter.h>
#import <ABI37_0_0React/components/scrollview/ScrollViewProps.h>
#import <ABI37_0_0React/components/scrollview/ScrollViewState.h>
#import <ABI37_0_0React/graphics/Geometry.h>

#import "ABI37_0_0RCTConversions.h"
#import "ABI37_0_0RCTEnhancedScrollView.h"

using namespace ABI37_0_0facebook::ABI37_0_0React;

@interface ABI37_0_0RCTScrollViewComponentView () <UIScrollViewDelegate>

@property (nonatomic, assign) CGFloat scrollEventThrottle;

@end

@implementation ABI37_0_0RCTScrollViewComponentView {
  ScrollViewShadowNode::ConcreteState::Shared _state;
  CGSize _contentSize;
}

+ (ABI37_0_0RCTScrollViewComponentView *_Nullable)findScrollViewComponentViewForView:(UIView *)view
{
  do {
    view = view.superview;
  } while (view != nil && ![view isKindOfClass:[ABI37_0_0RCTScrollViewComponentView class]]);
  return (ABI37_0_0RCTScrollViewComponentView *)view;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ScrollViewProps>();
    _props = defaultProps;

    _scrollView = [[ABI37_0_0RCTEnhancedScrollView alloc] initWithFrame:self.bounds];
    _scrollView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _scrollView.delaysContentTouches = NO;
    [self addSubview:_scrollView];

    _containerView = [[UIView alloc] initWithFrame:CGRectZero];
    [_scrollView addSubview:_containerView];

    __weak __typeof(self) weakSelf = self;
    _scrollViewDelegateSplitter = [[ABI37_0_0RCTGenericDelegateSplitter alloc] initWithDelegateUpdateBlock:^(id delegate) {
      weakSelf.scrollView.delegate = delegate;
    }];

    [_scrollViewDelegateSplitter addDelegate:self];
  }

  return self;
}

#pragma mark - ABI37_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldScrollViewProps = *std::static_pointer_cast<const ScrollViewProps>(_props);
  const auto &newScrollViewProps = *std::static_pointer_cast<const ScrollViewProps>(props);

#define REMAP_PROP(ABI37_0_0ReactName, localName, target)                      \
  if (oldScrollViewProps.ABI37_0_0ReactName != newScrollViewProps.ABI37_0_0ReactName) { \
    target.localName = newScrollViewProps.ABI37_0_0ReactName;                  \
  }

#define REMAP_VIEW_PROP(ABI37_0_0ReactName, localName) REMAP_PROP(ABI37_0_0ReactName, localName, self)
#define MAP_VIEW_PROP(name) REMAP_VIEW_PROP(name, name)
#define REMAP_SCROLL_VIEW_PROP(ABI37_0_0ReactName, localName) \
  REMAP_PROP(ABI37_0_0ReactName, localName, ((ABI37_0_0RCTEnhancedScrollView *)_scrollView))
#define MAP_SCROLL_VIEW_PROP(name) REMAP_SCROLL_VIEW_PROP(name, name)

  // FIXME: Commented props are not supported yet.
  MAP_SCROLL_VIEW_PROP(alwaysBounceHorizontal);
  MAP_SCROLL_VIEW_PROP(alwaysBounceVertical);
  MAP_SCROLL_VIEW_PROP(bounces);
  MAP_SCROLL_VIEW_PROP(bouncesZoom);
  MAP_SCROLL_VIEW_PROP(canCancelContentTouches);
  MAP_SCROLL_VIEW_PROP(centerContent);
  // MAP_SCROLL_VIEW_PROP(automaticallyAdjustContentInsets);
  MAP_SCROLL_VIEW_PROP(decelerationRate);
  MAP_SCROLL_VIEW_PROP(directionalLockEnabled);
  // MAP_SCROLL_VIEW_PROP(indicatorStyle);
  // MAP_SCROLL_VIEW_PROP(keyboardDismissMode);
  MAP_SCROLL_VIEW_PROP(maximumZoomScale);
  MAP_SCROLL_VIEW_PROP(minimumZoomScale);
  MAP_SCROLL_VIEW_PROP(scrollEnabled);
  MAP_SCROLL_VIEW_PROP(pagingEnabled);
  MAP_SCROLL_VIEW_PROP(pinchGestureEnabled);
  MAP_SCROLL_VIEW_PROP(scrollsToTop);
  MAP_SCROLL_VIEW_PROP(showsHorizontalScrollIndicator);
  MAP_SCROLL_VIEW_PROP(showsVerticalScrollIndicator);
  MAP_VIEW_PROP(scrollEventThrottle);
  MAP_SCROLL_VIEW_PROP(zoomScale);

  if (oldScrollViewProps.contentInset != newScrollViewProps.contentInset) {
    _scrollView.contentInset = ABI37_0_0RCTUIEdgeInsetsFromEdgeInsets(newScrollViewProps.contentInset);
  }

  // MAP_SCROLL_VIEW_PROP(scrollIndicatorInsets);
  // MAP_SCROLL_VIEW_PROP(snapToInterval);
  // MAP_SCROLL_VIEW_PROP(snapToAlignment);

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  assert(std::dynamic_pointer_cast<ScrollViewShadowNode::ConcreteState const>(state));
  _state = std::static_pointer_cast<ScrollViewShadowNode::ConcreteState const>(state);

  CGSize contentSize = ABI37_0_0RCTCGSizeFromSize(_state->getData().getContentSize());

  if (CGSizeEqualToSize(_contentSize, contentSize)) {
    return;
  }

  _contentSize = contentSize;
  _containerView.frame = CGRect{CGPointZero, contentSize};
  _scrollView.contentSize = contentSize;
}

- (void)mountChildComponentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_containerView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  ABI37_0_0RCTAssert(childComponentView.superview == _containerView, @"Attempt to unmount improperly mounted component view.");
  [childComponentView removeFromSuperview];
}

- (ScrollViewMetrics)_scrollViewMetrics
{
  ScrollViewMetrics metrics;
  metrics.contentSize = ABI37_0_0RCTSizeFromCGSize(_scrollView.contentSize);
  metrics.contentOffset = ABI37_0_0RCTPointFromCGPoint(_scrollView.contentOffset);
  metrics.contentInset = ABI37_0_0RCTEdgeInsetsFromUIEdgeInsets(_scrollView.contentInset);
  metrics.containerSize = ABI37_0_0RCTSizeFromCGSize(_scrollView.bounds.size);
  metrics.zoomScale = _scrollView.zoomScale;
  return metrics;
}

- (void)_updateStateWithContentOffset
{
  auto contentOffset = ABI37_0_0RCTPointFromCGPoint(_scrollView.contentOffset);

  _state->updateState([contentOffset](ScrollViewShadowNode::ConcreteState::Data const &data) {
    auto newData = data;
    newData.contentOffset = contentOffset;
    return newData;
  });
}

- (void)prepareForRecycle
{
  _scrollView.contentOffset = CGPointZero;
  [super prepareForRecycle];
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScroll([self _scrollViewMetrics]);
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScroll([self _scrollViewMetrics]);
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScrollBeginDrag([self _scrollViewMetrics]);
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView
                     withVelocity:(CGPoint)velocity
              targetContentOffset:(inout CGPoint *)targetContentOffset
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScrollEndDrag([self _scrollViewMetrics]);
}

- (void)scrollViewWillBeginDecelerating:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)
      ->onMomentumScrollBegin([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScrollBeginDrag([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view atScale:(CGFloat)scale
{
  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<const ScrollViewEventEmitter>(_eventEmitter)->onScrollEndDrag([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

@end

@implementation ABI37_0_0RCTScrollViewComponentView (ScrollableProtocol)

- (CGSize)contentSize
{
  return _contentSize;
}

- (void)scrollToOffset:(CGPoint)offset
{
  [self scrollToOffset:offset animated:YES];
}

- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated
{
  [self.scrollView setContentOffset:offset animated:animated];
}

- (void)scrollToEnd:(BOOL)animated
{
  // Not implemented.
}

- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated
{
  // Not implemented.
}

- (void)addScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [self.scrollViewDelegateSplitter addDelegate:scrollListener];
}

- (void)removeScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [self.scrollViewDelegateSplitter removeDelegate:scrollListener];
}

@end
