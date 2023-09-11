/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTScrollView.h"

#import <UIKit/UIKit.h>

#import "ABI47_0_0RCTConvert.h"
#import "ABI47_0_0RCTLog.h"
#import "ABI47_0_0RCTRefreshControl.h"
#import "ABI47_0_0RCTScrollEvent.h"
#import "ABI47_0_0RCTUIManager.h"
#import "ABI47_0_0RCTUIManagerObserverCoordinator.h"
#import "ABI47_0_0RCTUIManagerUtils.h"
#import "ABI47_0_0RCTUtils.h"
#import "ABI47_0_0RCTViewUtils.h"
#import "ABI47_0_0UIView+Private.h"
#import "ABI47_0_0UIView+React.h"

/**
 * Include a custom scroll view subclass because we want to limit certain
 * default UIKit behaviors such as textFields automatically scrolling
 * scroll views that contain them.
 */
@interface ABI47_0_0RCTCustomScrollView : UIScrollView <UIGestureRecognizerDelegate>

@property (nonatomic, assign) BOOL centerContent;
@property (nonatomic, strong) UIView<ABI47_0_0RCTCustomRefreshContolProtocol> *customRefreshControl;
@property (nonatomic, assign) BOOL pinchGestureEnabled;

@end

@implementation ABI47_0_0RCTCustomScrollView

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self.panGestureRecognizer addTarget:self action:@selector(handleCustomPan:)];

    if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
      // We intentionally force `UIScrollView`s `semanticContentAttribute` to `LTR` here
      // because this attribute affects a position of vertical scrollbar; we don't want this
      // scrollbar flip because we also flip it with whole `UIScrollView` flip.
      self.semanticContentAttribute = UISemanticContentAttributeForceLeftToRight;
    }

    _pinchGestureEnabled = YES;
  }
  return self;
}

- (UIView *)contentView
{
  return ((ABI47_0_0RCTScrollView *)self.superview).contentView;
}

/**
 * @return Whether or not the scroll view interaction should be blocked because
 * JS was found to be the responder.
 */
- (BOOL)_shouldDisableScrollInteraction
{
  // Since this may be called on every pan, we need to make sure to only climb
  // the hierarchy on rare occasions.
  UIView *JSResponder = [ABI47_0_0RCTUIManager JSResponder];
  if (JSResponder && JSResponder != self.superview) {
    BOOL superviewHasResponder = [self isDescendantOfView:JSResponder];
    return superviewHasResponder;
  }
  return NO;
}

- (void)handleCustomPan:(__unused UIPanGestureRecognizer *)sender
{
  if ([self _shouldDisableScrollInteraction] && ![[ABI47_0_0RCTUIManager JSResponder] isKindOfClass:[ABI47_0_0RCTScrollView class]]) {
    self.panGestureRecognizer.enabled = NO;
    self.panGestureRecognizer.enabled = YES;
    // TODO: If mid bounce, animate the scroll view to a non-bounced position
    // while disabling (but only if `stopScrollInteractionIfJSHasResponder` was
    // called *during* a `pan`). Currently, it will just snap into place which
    // is not so bad either.
    // Another approach:
    // self.scrollEnabled = NO;
    // self.scrollEnabled = YES;
  }
}

- (void)scrollRectToVisible:(CGRect)rect animated:(BOOL)animated
{
  // Limiting scroll area to an area where we actually have content.
  CGSize contentSize = self.contentSize;
  UIEdgeInsets contentInset = self.contentInset;
  CGSize fullSize = CGSizeMake(
      contentSize.width + contentInset.left + contentInset.right,
      contentSize.height + contentInset.top + contentInset.bottom);

  rect = CGRectIntersection((CGRect){CGPointZero, fullSize}, rect);
  if (CGRectIsNull(rect)) {
    return;
  }

  [super scrollRectToVisible:rect animated:animated];
}

/**
 * Returning `YES` cancels touches for the "inner" `view` and causes a scroll.
 * Returning `NO` causes touches to be directed to that inner view and prevents
 * the scroll view from scrolling.
 *
 * `YES` -> Allows scrolling.
 * `NO` -> Doesn't allow scrolling.
 *
 * By default this returns NO for all views that are UIControls and YES for
 * everything else. What that does is allows scroll views to scroll even when a
 * touch started inside of a `UIControl` (`UIButton` etc). For ABI47_0_0React scroll
 * views, we want the default to be the same behavior as `UIControl`s so we
 * return `YES` by default. But there's one case where we want to block the
 * scrolling no matter what: When JS believes it has its own responder lock on
 * a view that is *above* the scroll view in the hierarchy. So we abuse this
 * `touchesShouldCancelInContentView` API in order to stop the scroll view from
 * scrolling in this case.
 *
 * We are not aware of *any* other solution to the problem because alternative
 * approaches require that we disable the scrollview *before* touches begin or
 * move. This approach (`touchesShouldCancelInContentView`) works even if the
 * JS responder is set after touches start/move because
 * `touchesShouldCancelInContentView` is called as soon as the scroll view has
 * been touched and dragged *just* far enough to decide to begin the "drag"
 * movement of the scroll interaction. Returning `NO`, will cause the drag
 * operation to fail.
 *
 * `touchesShouldCancelInContentView` will stop the *initialization* of a
 * scroll pan gesture and most of the time this is sufficient. On rare
 * occasion, the scroll gesture would have already initialized right before JS
 * notifies native of the JS responder being set. In order to recover from that
 * timing issue we have a fallback that kills any ongoing pan gesture that
 * occurs when native is notified of a JS responder.
 *
 * Note: Explicitly returning `YES`, instead of relying on the default fixes
 * (at least) one bug where if you have a UIControl inside a UIScrollView and
 * tap on the UIControl and then start dragging (to scroll), it won't scroll.
 * Chat with @andras for more details.
 *
 * In order to have this called, you must have delaysContentTouches set to NO
 * (which is the not the `UIKit` default).
 */
- (BOOL)touchesShouldCancelInContentView:(__unused UIView *)view
{
  BOOL shouldDisableScrollInteraction = [self _shouldDisableScrollInteraction];

  if (shouldDisableScrollInteraction == NO) {
    [super touchesShouldCancelInContentView:view];
  }

  return !shouldDisableScrollInteraction;
}

/*
 * Automatically centers the content such that if the content is smaller than the
 * ScrollView, we force it to be centered, but when you zoom or the content otherwise
 * becomes larger than the ScrollView, there is no padding around the content but it
 * can still fill the whole view.
 */
- (void)setContentOffset:(CGPoint)contentOffset
{
  UIView *contentView = [self contentView];
  if (contentView && _centerContent && !CGSizeEqualToSize(contentView.frame.size, CGSizeZero)) {
    CGSize subviewSize = contentView.frame.size;
    CGSize scrollViewSize = self.bounds.size;
    if (subviewSize.width <= scrollViewSize.width) {
      contentOffset.x = -(scrollViewSize.width - subviewSize.width) / 2.0;
    }
    if (subviewSize.height <= scrollViewSize.height) {
      contentOffset.y = -(scrollViewSize.height - subviewSize.height) / 2.0;
    }
  }

  super.contentOffset = CGPointMake(
      ABI47_0_0RCTSanitizeNaNValue(contentOffset.x, @"scrollView.contentOffset.x"),
      ABI47_0_0RCTSanitizeNaNValue(contentOffset.y, @"scrollView.contentOffset.y"));
}

- (void)setFrame:(CGRect)frame
{
  // Preserving and revalidating `contentOffset`.
  CGPoint originalOffset = self.contentOffset;

  [super setFrame:frame];

  UIEdgeInsets contentInset = self.contentInset;
  CGSize contentSize = self.contentSize;

  // If contentSize has not been measured yet we can't check bounds.
  if (CGSizeEqualToSize(contentSize, CGSizeZero)) {
    self.contentOffset = originalOffset;
  } else {
    if (!UIEdgeInsetsEqualToEdgeInsets(UIEdgeInsetsZero, self.adjustedContentInset)) {
      contentInset = self.adjustedContentInset;
    }
    CGSize boundsSize = self.bounds.size;
    CGFloat xMaxOffset = contentSize.width - boundsSize.width + contentInset.right;
    CGFloat yMaxOffset = contentSize.height - boundsSize.height + contentInset.bottom;
    // Make sure offset doesn't exceed bounds. This can happen on screen rotation.
    if ((originalOffset.x >= -contentInset.left) && (originalOffset.x <= xMaxOffset) &&
        (originalOffset.y >= -contentInset.top) && (originalOffset.y <= yMaxOffset)) {
      return;
    }
    self.contentOffset = CGPointMake(
        MAX(-contentInset.left, MIN(xMaxOffset, originalOffset.x)),
        MAX(-contentInset.top, MIN(yMaxOffset, originalOffset.y)));
  }
}

- (void)setCustomRefreshControl:(UIView<ABI47_0_0RCTCustomRefreshContolProtocol> *)refreshControl
{
  if (_customRefreshControl) {
    [_customRefreshControl removeFromSuperview];
  }
  _customRefreshControl = refreshControl;
  // We have to set this because we can't always guarantee the
  // `ABI47_0_0RCTCustomRefreshContolProtocol`'s superview will always be of class
  // `UIScrollView` like we were previously
  if ([_customRefreshControl respondsToSelector:@selector(setScrollView:)]) {
    _customRefreshControl.scrollView = self;
  }
  if ([refreshControl isKindOfClass:UIRefreshControl.class]) {
    self.refreshControl = (UIRefreshControl *)refreshControl;
  } else {
    [self addSubview:_customRefreshControl];
  }
}

- (void)setPinchGestureEnabled:(BOOL)pinchGestureEnabled
{
  self.pinchGestureRecognizer.enabled = pinchGestureEnabled;
  _pinchGestureEnabled = pinchGestureEnabled;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  // ScrollView enables pinch gesture late in its lifecycle. So simply setting it
  // in the setter gets overridden when the view loads.
  self.pinchGestureRecognizer.enabled = _pinchGestureEnabled;
}

- (BOOL)shouldGroupAccessibilityChildren
{
  return YES;
}

@end

@interface ABI47_0_0RCTScrollView () <ABI47_0_0RCTUIManagerObserver>

@end

@implementation ABI47_0_0RCTScrollView {
  id<ABI47_0_0RCTEventDispatcherProtocol> _eventDispatcher;
  CGRect _prevFirstVisibleFrame;
  __weak UIView *_firstVisibleView;
  ABI47_0_0RCTCustomScrollView *_scrollView;
  UIView *_contentView;
  NSTimeInterval _lastScrollDispatchTime;
  NSMutableArray<NSValue *> *_cachedChildFrames;
  BOOL _allowNextScrollNoMatterWhat;
  CGRect _lastClippedToRect;
  uint16_t _coalescingKey;
  NSString *_lastEmittedEventName;
  NSHashTable *_scrollListeners;
}

- (void)_registerKeyboardListener
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_keyboardWillChangeFrame:)
                                               name:UIKeyboardWillChangeFrameNotification
                                             object:nil];
}

- (void)_unregisterKeyboardListener
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillChangeFrameNotification object:nil];
}

static inline UIViewAnimationOptions animationOptionsWithCurve(UIViewAnimationCurve curve)
{
  // UIViewAnimationCurve #7 is used for keyboard and therefore private - so we can't use switch/case here.
  // source: https://stackoverflow.com/a/7327374/5281431
  ABI47_0_0RCTAssert(
      UIViewAnimationCurveLinear << 16 == UIViewAnimationOptionCurveLinear,
      @"Unexpected implementation of UIViewAnimationCurve");
  return curve << 16;
}

- (void)_keyboardWillChangeFrame:(NSNotification *)notification
{
  if (![self automaticallyAdjustKeyboardInsets]) {
    return;
  }
  if ([self isHorizontal:_scrollView]) {
    return;
  }

  double duration = [notification.userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationCurve curve =
      (UIViewAnimationCurve)[notification.userInfo[UIKeyboardAnimationCurveUserInfoKey] unsignedIntegerValue];
  CGRect beginFrame = [notification.userInfo[UIKeyboardFrameBeginUserInfoKey] CGRectValue];
  CGRect endFrame = [notification.userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];

  CGPoint absoluteViewOrigin = [self convertPoint:self.bounds.origin toView:nil];
  CGFloat scrollViewLowerY = self.inverted ? absoluteViewOrigin.y : absoluteViewOrigin.y + self.bounds.size.height;

  UIEdgeInsets newEdgeInsets = _scrollView.contentInset;
  CGFloat inset = MAX(scrollViewLowerY - endFrame.origin.y, 0);
  if (self.inverted) {
    newEdgeInsets.top = MAX(inset, _contentInset.top);
  } else {
    newEdgeInsets.bottom = MAX(inset, _contentInset.bottom);
  }

  CGPoint newContentOffset = _scrollView.contentOffset;
  CGFloat contentDiff = endFrame.origin.y - beginFrame.origin.y;
  if (self.inverted) {
    newContentOffset.y += contentDiff;
  } else {
    newContentOffset.y -= contentDiff;
  }

  [UIView animateWithDuration:duration
                        delay:0.0
                      options:animationOptionsWithCurve(curve)
                   animations:^{
                     self->_scrollView.contentInset = newEdgeInsets;
                     self->_scrollView.scrollIndicatorInsets = newEdgeInsets;
                     [self scrollToOffset:newContentOffset animated:NO];
                   }
                   completion:nil];
}

- (instancetype)initWithEventDispatcher:(id<ABI47_0_0RCTEventDispatcherProtocol>)eventDispatcher
{
  ABI47_0_0RCTAssertParam(eventDispatcher);

  if ((self = [super initWithFrame:CGRectZero])) {
    [self _registerKeyboardListener];
    _eventDispatcher = eventDispatcher;

    _scrollView = [[ABI47_0_0RCTCustomScrollView alloc] initWithFrame:CGRectZero];
    _scrollView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _scrollView.delegate = self;
    _scrollView.delaysContentTouches = NO;

    // We set the default behavior to "never" so that iOS
    // doesn't do weird things to UIScrollView insets automatically
    // and keeps it as an opt-in behavior.
    _scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;

    _automaticallyAdjustContentInsets = YES;
    _contentInset = UIEdgeInsetsZero;
    _lastClippedToRect = CGRectNull;

    _scrollEventThrottle = 0.0;
    _lastScrollDispatchTime = 0;
    _cachedChildFrames = [NSMutableArray new];

    _scrollListeners = [NSHashTable weakObjectsHashTable];

    [self addSubview:_scrollView];
  }
  return self;
}

ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

static inline void ABI47_0_0RCTApplyTransformationAccordingLayoutDirection(
    UIView *view,
    UIUserInterfaceLayoutDirection layoutDirection)
{
  view.transform = layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ? CGAffineTransformIdentity
                                                                                : CGAffineTransformMakeScale(-1, 1);
}

- (void)setABI47_0_0ReactLayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  [super setABI47_0_0ReactLayoutDirection:layoutDirection];

  ABI47_0_0RCTApplyTransformationAccordingLayoutDirection(_scrollView, layoutDirection);
  ABI47_0_0RCTApplyTransformationAccordingLayoutDirection(_contentView, layoutDirection);
}

- (void)setRemoveClippedSubviews:(__unused BOOL)removeClippedSubviews
{
  // Does nothing
}

- (void)insertABI47_0_0ReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  [super insertABI47_0_0ReactSubview:view atIndex:atIndex];
  if ([view conformsToProtocol:@protocol(ABI47_0_0RCTCustomRefreshContolProtocol)]) {
    [_scrollView setCustomRefreshControl:(UIView<ABI47_0_0RCTCustomRefreshContolProtocol> *)view];
    if (![view isKindOfClass:[UIRefreshControl class]] && [view conformsToProtocol:@protocol(UIScrollViewDelegate)]) {
      [self addScrollListener:(UIView<UIScrollViewDelegate> *)view];
    }
  } else {
    ABI47_0_0RCTAssert(
        _contentView == nil,
        @"ABI47_0_0RCTScrollView may only contain a single subview, the already set subview looks like: %@",
        [_contentView ABI47_0_0React_recursiveDescription]);
    _contentView = view;
    ABI47_0_0RCTApplyTransformationAccordingLayoutDirection(_contentView, self.ABI47_0_0ReactLayoutDirection);
    [_scrollView addSubview:view];
  }
}

- (void)removeABI47_0_0ReactSubview:(UIView *)subview
{
  [super removeABI47_0_0ReactSubview:subview];
  if ([subview conformsToProtocol:@protocol(ABI47_0_0RCTCustomRefreshContolProtocol)]) {
    [_scrollView setCustomRefreshControl:nil];
    if (![subview isKindOfClass:[UIRefreshControl class]] &&
        [subview conformsToProtocol:@protocol(UIScrollViewDelegate)]) {
      [self removeScrollListener:(UIView<UIScrollViewDelegate> *)subview];
    }
  } else {
    ABI47_0_0RCTAssert(_contentView == subview, @"Attempted to remove non-existent subview");
    _contentView = nil;
  }
}

- (void)didUpdateABI47_0_0ReactSubviews
{
  // Do nothing, as subviews are managed by `insertABI47_0_0ReactSubview:atIndex:`
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  if ([changedProps containsObject:@"contentSize"]) {
    [self updateContentSizeIfNeeded];
  }
}

- (BOOL)centerContent
{
  return _scrollView.centerContent;
}

- (void)setCenterContent:(BOOL)centerContent
{
  _scrollView.centerContent = centerContent;
}

- (void)setClipsToBounds:(BOOL)clipsToBounds
{
  super.clipsToBounds = clipsToBounds;
  _scrollView.clipsToBounds = clipsToBounds;
}

- (void)dealloc
{
  _scrollView.delegate = nil;
  [_eventDispatcher.bridge.uiManager.observerCoordinator removeObserver:self];
  [self _unregisterKeyboardListener];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  ABI47_0_0RCTAssert(self.subviews.count == 1, @"we should only have exactly one subview");
  ABI47_0_0RCTAssert([self.subviews lastObject] == _scrollView, @"our only subview should be a scrollview");

#if !TARGET_OS_TV
  // Adjust the refresh control frame if the scrollview layout changes.
  UIView<ABI47_0_0RCTCustomRefreshContolProtocol> *refreshControl = _scrollView.customRefreshControl;
  if (refreshControl && refreshControl.isRefreshing && ![refreshControl isKindOfClass:UIRefreshControl.class]) {
    refreshControl.frame =
        (CGRect){_scrollView.contentOffset, {_scrollView.frame.size.width, refreshControl.frame.size.height}};
  }
#endif

  [self updateClippedSubviews];
}

- (void)updateClippedSubviews
{
  // Find a suitable view to use for clipping
  UIView *clipView = [self ABI47_0_0React_findClipView];
  if (!clipView) {
    return;
  }

  static const CGFloat leeway = 1.0;

  const CGSize contentSize = _scrollView.contentSize;
  const CGRect bounds = _scrollView.bounds;
  const BOOL scrollsHorizontally = contentSize.width > bounds.size.width;
  const BOOL scrollsVertically = contentSize.height > bounds.size.height;

  const BOOL shouldClipAgain = CGRectIsNull(_lastClippedToRect) || !CGRectEqualToRect(_lastClippedToRect, bounds) ||
      (scrollsHorizontally &&
       (bounds.size.width < leeway || fabs(_lastClippedToRect.origin.x - bounds.origin.x) >= leeway)) ||
      (scrollsVertically &&
       (bounds.size.height < leeway || fabs(_lastClippedToRect.origin.y - bounds.origin.y) >= leeway));

  if (shouldClipAgain) {
    const CGRect clipRect = CGRectInset(clipView.bounds, -leeway, -leeway);
    [self ABI47_0_0React_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
    _lastClippedToRect = bounds;
  }
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  if (UIEdgeInsetsEqualToEdgeInsets(contentInset, _contentInset)) {
    return;
  }

  CGPoint contentOffset = _scrollView.contentOffset;

  _contentInset = contentInset;
  [ABI47_0_0RCTView autoAdjustInsetsForView:self withScrollView:_scrollView updateOffset:NO];

  _scrollView.contentOffset = contentOffset;
}

- (BOOL)isHorizontal:(UIScrollView *)scrollView
{
  return scrollView.contentSize.width > self.frame.size.width;
}

- (void)scrollToOffset:(CGPoint)offset
{
  [self scrollToOffset:offset animated:YES];
}

- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated
{
  if (!CGPointEqualToPoint(_scrollView.contentOffset, offset)) {
    CGRect maxRect = CGRectMake(
        fmin(-_scrollView.contentInset.left, 0),
        fmin(-_scrollView.contentInset.top, 0),
        fmax(
            _scrollView.contentSize.width - _scrollView.bounds.size.width + _scrollView.contentInset.right +
                fmax(_scrollView.contentInset.left, 0),
            0.01),
        fmax(
            _scrollView.contentSize.height - _scrollView.bounds.size.height + _scrollView.contentInset.bottom +
                fmax(_scrollView.contentInset.top, 0),
            0.01)); // Make width and height greater than 0
    // Ensure at least one scroll event will fire
    _allowNextScrollNoMatterWhat = YES;
    if (!CGRectContainsPoint(maxRect, offset) && !self.scrollToOverflowEnabled) {
      CGFloat x = fmax(offset.x, CGRectGetMinX(maxRect));
      x = fmin(x, CGRectGetMaxX(maxRect));
      CGFloat y = fmax(offset.y, CGRectGetMinY(maxRect));
      y = fmin(y, CGRectGetMaxY(maxRect));
      offset = CGPointMake(x, y);
    }
    [_scrollView setContentOffset:offset animated:animated];
  }
}

/**
 * If this is a vertical scroll view, scrolls to the bottom.
 * If this is a horizontal scroll view, scrolls to the right.
 */
- (void)scrollToEnd:(BOOL)animated
{
  BOOL isHorizontal = [self isHorizontal:_scrollView];
  CGPoint offset;
  if (isHorizontal) {
    CGFloat offsetX = _scrollView.contentSize.width - _scrollView.bounds.size.width + _scrollView.contentInset.right;
    offset = CGPointMake(fmax(offsetX, 0), 0);
  } else {
    CGFloat offsetY = _scrollView.contentSize.height - _scrollView.bounds.size.height + _scrollView.contentInset.bottom;
    offset = CGPointMake(0, fmax(offsetY, 0));
  }
  if (!CGPointEqualToPoint(_scrollView.contentOffset, offset)) {
    // Ensure at least one scroll event will fire
    _allowNextScrollNoMatterWhat = YES;
    [_scrollView setContentOffset:offset animated:animated];
  }
}

- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated
{
  [_scrollView zoomToRect:rect animated:animated];
}

- (void)refreshContentInset
{
  [ABI47_0_0RCTView autoAdjustInsetsForView:self withScrollView:_scrollView updateOffset:YES];
}

#pragma mark - ScrollView delegate

#define ABI47_0_0RCT_SEND_SCROLL_EVENT(_eventName, _userData)                                    \
  {                                                                                     \
    NSString *eventName = NSStringFromSelector(@selector(_eventName));                  \
    [self sendScrollEventWithName:eventName scrollView:_scrollView userData:_userData]; \
  }

#define ABI47_0_0RCT_FORWARD_SCROLL_EVENT(call)                                            \
  for (NSObject<UIScrollViewDelegate> * scrollViewListener in _scrollListeners) { \
    if ([scrollViewListener respondsToSelector:_cmd]) {                           \
      [scrollViewListener call];                                                  \
    }                                                                             \
  }

#define ABI47_0_0RCT_SCROLL_EVENT_HANDLER(delegateMethod, eventName) \
  -(void)delegateMethod : (UIScrollView *)scrollView        \
  {                                                         \
    ABI47_0_0RCT_SEND_SCROLL_EVENT(eventName, nil);                  \
    ABI47_0_0RCT_FORWARD_SCROLL_EVENT(delegateMethod : scrollView);  \
  }

ABI47_0_0RCT_SCROLL_EVENT_HANDLER(scrollViewWillBeginDecelerating, onMomentumScrollBegin)
ABI47_0_0RCT_SCROLL_EVENT_HANDLER(scrollViewDidZoom, onScroll)
ABI47_0_0RCT_SCROLL_EVENT_HANDLER(scrollViewDidScrollToTop, onScrollToTop)

- (void)addScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [_scrollListeners addObject:scrollListener];
}

- (void)removeScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [_scrollListeners removeObject:scrollListener];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  NSTimeInterval now = CACurrentMediaTime();
  [self updateClippedSubviews];
  /**
   * TODO: this logic looks wrong, and it may be because it is. Currently, if _scrollEventThrottle
   * is set to zero (the default), the "didScroll" event is only sent once per scroll, instead of repeatedly
   * while scrolling as expected. However, if you "fix" that bug, ScrollView will generate repeated
   * warnings, and behave strangely (ListView works fine however), so don't fix it unless you fix that too!
   *
   * We limit the delta to 17ms so that small throttles intended to enable 60fps updates will not
   * inadvertently filter out any scroll events.
   */
  if (_allowNextScrollNoMatterWhat ||
      (_scrollEventThrottle > 0 && _scrollEventThrottle < MAX(0.017, now - _lastScrollDispatchTime))) {
    ABI47_0_0RCT_SEND_SCROLL_EVENT(onScroll, nil);
    // Update dispatch time
    _lastScrollDispatchTime = now;
    _allowNextScrollNoMatterWhat = NO;
  }
  ABI47_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewDidScroll : scrollView);
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  _allowNextScrollNoMatterWhat = YES; // Ensure next scroll event is recorded, regardless of throttle
  ABI47_0_0RCT_SEND_SCROLL_EVENT(onScrollBeginDrag, nil);
  ABI47_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewWillBeginDragging : scrollView);
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView
                     withVelocity:(CGPoint)velocity
              targetContentOffset:(inout CGPoint *)targetContentOffset
{
  if (self.snapToOffsets) {
    // An alternative to enablePaging and snapToInterval which allows setting custom
    // stopping points that don't have to be the same distance apart. Often seen in
    // apps which feature horizonally scrolling items. snapToInterval does not enforce
    // scrolling one interval at a time but guarantees that the scroll will stop at
    // a snap offset point.

    // Find which axis to snap
    BOOL isHorizontal = [self isHorizontal:scrollView];
    CGFloat velocityAlongAxis = isHorizontal ? velocity.x : velocity.y;
    CGFloat offsetAlongAxis = isHorizontal ? _scrollView.contentOffset.x : _scrollView.contentOffset.y;

    // Calculate maximum content offset
    CGSize viewportSize = [self _calculateViewportSize];
    CGFloat maximumOffset = isHorizontal ? MAX(0, _scrollView.contentSize.width - viewportSize.width)
                                         : MAX(0, _scrollView.contentSize.height - viewportSize.height);

    // Calculate the snap offsets adjacent to the initial offset target
    CGFloat targetOffset = isHorizontal ? targetContentOffset->x : targetContentOffset->y;
    CGFloat smallerOffset = 0.0;
    CGFloat largerOffset = maximumOffset;

    for (unsigned long i = 0; i < self.snapToOffsets.count; i++) {
      CGFloat offset = [[self.snapToOffsets objectAtIndex:i] floatValue];

      if (offset <= targetOffset) {
        if (targetOffset - offset < targetOffset - smallerOffset) {
          smallerOffset = offset;
        }
      }

      if (offset >= targetOffset) {
        if (offset - targetOffset < largerOffset - targetOffset) {
          largerOffset = offset;
        }
      }
    }

    // Calculate the nearest offset
    CGFloat nearestOffset = targetOffset - smallerOffset < largerOffset - targetOffset ? smallerOffset : largerOffset;

    CGFloat firstOffset = [[self.snapToOffsets firstObject] floatValue];
    CGFloat lastOffset = [[self.snapToOffsets lastObject] floatValue];

    // if scrolling after the last snap offset and snapping to the
    // end of the list is disabled, then we allow free scrolling
    if (!self.snapToEnd && targetOffset >= lastOffset) {
      if (offsetAlongAxis >= lastOffset) {
        // free scrolling
      } else {
        // snap to end
        targetOffset = lastOffset;
      }
    } else if (!self.snapToStart && targetOffset <= firstOffset) {
      if (offsetAlongAxis <= firstOffset) {
        // free scrolling
      } else {
        // snap to beginning
        targetOffset = firstOffset;
      }
    } else if (velocityAlongAxis > 0.0) {
      targetOffset = largerOffset;
    } else if (velocityAlongAxis < 0.0) {
      targetOffset = smallerOffset;
    } else {
      targetOffset = nearestOffset;
    }

    // Make sure the new offset isn't out of bounds
    targetOffset = MIN(MAX(0, targetOffset), maximumOffset);

    // Set new targetContentOffset
    if (isHorizontal) {
      targetContentOffset->x = targetOffset;
    } else {
      targetContentOffset->y = targetOffset;
    }
  } else if (self.snapToInterval) {
    // An alternative to enablePaging which allows setting custom stopping intervals,
    // smaller than a full page size. Often seen in apps which feature horizonally
    // scrolling items. snapToInterval does not enforce scrolling one interval at a time
    // but guarantees that the scroll will stop at an interval point.
    CGFloat snapToIntervalF = (CGFloat)self.snapToInterval;

    // Find which axis to snap
    BOOL isHorizontal = [self isHorizontal:scrollView];

    // What is the current offset?
    CGFloat velocityAlongAxis = isHorizontal ? velocity.x : velocity.y;
    CGFloat targetContentOffsetAlongAxis = targetContentOffset->y;
    if (isHorizontal) {
      // Use current scroll offset to determine the next index to snap to when momentum disabled
      targetContentOffsetAlongAxis = self.disableIntervalMomentum ? scrollView.contentOffset.x : targetContentOffset->x;
    } else {
      targetContentOffsetAlongAxis = self.disableIntervalMomentum ? scrollView.contentOffset.y : targetContentOffset->y;
    }

    // Offset based on desired alignment
    CGFloat frameLength = isHorizontal ? self.frame.size.width : self.frame.size.height;
    CGFloat alignmentOffset = 0.0f;
    if ([self.snapToAlignment isEqualToString:@"center"]) {
      alignmentOffset = (frameLength * 0.5f) + (snapToIntervalF * 0.5f);
    } else if ([self.snapToAlignment isEqualToString:@"end"]) {
      alignmentOffset = frameLength;
    }

    // Pick snap point based on direction and proximity
    CGFloat fractionalIndex = (targetContentOffsetAlongAxis + alignmentOffset) / snapToIntervalF;

    NSInteger snapIndex = velocityAlongAxis > 0.0 ? ceil(fractionalIndex)
        : velocityAlongAxis < 0.0                 ? floor(fractionalIndex)
                                                  : round(fractionalIndex);
    CGFloat newTargetContentOffset = (snapIndex * snapToIntervalF) - alignmentOffset;

    // Set new targetContentOffset
    if (isHorizontal) {
      targetContentOffset->x = newTargetContentOffset;
    } else {
      targetContentOffset->y = newTargetContentOffset;
    }
  }

  NSDictionary *userData = @{
    @"velocity" : @{@"x" : @(velocity.x), @"y" : @(velocity.y)},
    @"targetContentOffset" : @{@"x" : @(targetContentOffset->x), @"y" : @(targetContentOffset->y)}
  };
  ABI47_0_0RCT_SEND_SCROLL_EVENT(onScrollEndDrag, userData);
  ABI47_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewWillEndDragging
                           : scrollView withVelocity
                           : velocity targetContentOffset
                           : targetContentOffset);
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
  ABI47_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewDidEndDragging : scrollView willDecelerate : decelerate);
}

- (void)scrollViewWillBeginZooming:(UIScrollView *)scrollView withView:(UIView *)view
{
  ABI47_0_0RCT_SEND_SCROLL_EVENT(onScrollBeginDrag, nil);
  ABI47_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewWillBeginZooming : scrollView withView : view);
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(UIView *)view atScale:(CGFloat)scale
{
  ABI47_0_0RCT_SEND_SCROLL_EVENT(onScrollEndDrag, nil);
  ABI47_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewDidEndZooming : scrollView withView : view atScale : scale);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  // Fire a final scroll event
  _allowNextScrollNoMatterWhat = YES;
  [self scrollViewDidScroll:scrollView];

  // Fire the end deceleration event
  ABI47_0_0RCT_SEND_SCROLL_EVENT(onMomentumScrollEnd, nil);
  ABI47_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewDidEndDecelerating : scrollView);
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
  // Fire a final scroll event
  _allowNextScrollNoMatterWhat = YES;
  [self scrollViewDidScroll:scrollView];

  // Fire the end deceleration event
  ABI47_0_0RCT_SEND_SCROLL_EVENT(onMomentumScrollEnd, nil);
  ABI47_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewDidEndScrollingAnimation : scrollView);
}

- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView
{
  for (NSObject<UIScrollViewDelegate> *scrollListener in _scrollListeners) {
    if ([scrollListener respondsToSelector:_cmd] && ![scrollListener scrollViewShouldScrollToTop:scrollView]) {
      return NO;
    }
  }

  if (self.inverted) {
    [self scrollToEnd:YES];
    return NO;
  }

  return YES;
}

- (UIView *)viewForZoomingInScrollView:(__unused UIScrollView *)scrollView
{
  return _contentView;
}

- (CGSize)_calculateViewportSize
{
  CGSize viewportSize = self.bounds.size;
  if (_automaticallyAdjustContentInsets) {
    UIEdgeInsets contentInsets = ABI47_0_0RCTContentInsets(self);
    viewportSize = CGSizeMake(
        self.bounds.size.width - contentInsets.left - contentInsets.right,
        self.bounds.size.height - contentInsets.top - contentInsets.bottom);
  }
  return viewportSize;
}

- (CGSize)contentSize
{
  return _contentView.frame.size;
}

- (void)updateContentSizeIfNeeded
{
  CGSize contentSize = self.contentSize;
  if (!CGSizeEqualToSize(_scrollView.contentSize, contentSize)) {
    _scrollView.contentSize = contentSize;
  }
}

// maintainVisibleContentPosition is used to allow seamless loading of content from both ends of
// the scrollview without the visible content jumping in position.
- (void)setMaintainVisibleContentPosition:(NSDictionary *)maintainVisibleContentPosition
{
  if (maintainVisibleContentPosition != nil && _maintainVisibleContentPosition == nil) {
    [_eventDispatcher.bridge.uiManager.observerCoordinator addObserver:self];
  } else if (maintainVisibleContentPosition == nil && _maintainVisibleContentPosition != nil) {
    [_eventDispatcher.bridge.uiManager.observerCoordinator removeObserver:self];
  }
  _maintainVisibleContentPosition = maintainVisibleContentPosition;
}

#pragma mark - ABI47_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(ABI47_0_0RCTUIManager *)manager
{
  ABI47_0_0RCTAssertUIManagerQueue();

  [manager prependUIBlock:^(
               __unused ABI47_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    BOOL horz = [self isHorizontal:self->_scrollView];
    NSUInteger minIdx = [self->_maintainVisibleContentPosition[@"minIndexForVisible"] integerValue];
    for (NSUInteger ii = minIdx; ii < self->_contentView.subviews.count; ++ii) {
      // Find the first entirely visible view. This must be done after we update the content offset
      // or it will tend to grab rows that were made visible by the shift in position
      UIView *subview = self->_contentView.subviews[ii];
      BOOL hasNewView = NO;
      if (horz) {
        CGFloat leftInset = self.inverted ? self->_scrollView.contentInset.right : self->_scrollView.contentInset.left;
        CGFloat x = self->_scrollView.contentOffset.x + leftInset;
        hasNewView = subview.frame.origin.x > x;
      } else {
        CGFloat bottomInset =
            self.inverted ? self->_scrollView.contentInset.top : self->_scrollView.contentInset.bottom;
        CGFloat y = self->_scrollView.contentOffset.y + bottomInset;
        hasNewView = subview.frame.origin.y > y;
      }
      if (hasNewView || ii == self->_contentView.subviews.count - 1) {
        self->_prevFirstVisibleFrame = subview.frame;
        self->_firstVisibleView = subview;
        break;
      }
    }
  }];
  [manager addUIBlock:^(__unused ABI47_0_0RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    if (self->_maintainVisibleContentPosition == nil) {
      return; // The prop might have changed in the previous UIBlocks, so need to abort here.
    }
    NSNumber *autoscrollThreshold = self->_maintainVisibleContentPosition[@"autoscrollToTopThreshold"];
    // TODO: detect and handle/ignore re-ordering
    if ([self isHorizontal:self->_scrollView]) {
      CGFloat deltaX = self->_firstVisibleView.frame.origin.x - self->_prevFirstVisibleFrame.origin.x;
      if (ABS(deltaX) > 0.1) {
        CGFloat leftInset = self.inverted ? self->_scrollView.contentInset.right : self->_scrollView.contentInset.left;
        CGFloat x = self->_scrollView.contentOffset.x + leftInset;
        self->_scrollView.contentOffset =
            CGPointMake(self->_scrollView.contentOffset.x + deltaX, self->_scrollView.contentOffset.y);
        if (autoscrollThreshold != nil) {
          // If the offset WAS within the threshold of the start, animate to the start.
          if (x - deltaX <= [autoscrollThreshold integerValue]) {
            [self scrollToOffset:CGPointMake(-leftInset, self->_scrollView.contentOffset.y) animated:YES];
          }
        }
      }
    } else {
      CGRect newFrame = self->_firstVisibleView.frame;
      CGFloat deltaY = newFrame.origin.y - self->_prevFirstVisibleFrame.origin.y;
      if (ABS(deltaY) > 0.1) {
        CGFloat bottomInset =
            self.inverted ? self->_scrollView.contentInset.top : self->_scrollView.contentInset.bottom;
        CGFloat y = self->_scrollView.contentOffset.y + bottomInset;
        self->_scrollView.contentOffset =
            CGPointMake(self->_scrollView.contentOffset.x, self->_scrollView.contentOffset.y + deltaY);
        if (autoscrollThreshold != nil) {
          // If the offset WAS within the threshold of the start, animate to the start.
          if (y - deltaY <= [autoscrollThreshold integerValue]) {
            [self scrollToOffset:CGPointMake(self->_scrollView.contentOffset.x, -bottomInset) animated:YES];
          }
        }
      }
    }
  }];
}

// Note: setting several properties of UIScrollView has the effect of
// resetting its contentOffset to {0, 0}. To prevent this, we generate
// setters here that will record the contentOffset beforehand, and
// restore it after the property has been set.

#define ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setter, getter, type) \
  -(void)setter : (type)value                             \
  {                                                       \
    CGPoint contentOffset = _scrollView.contentOffset;    \
    [_scrollView setter:value];                           \
    _scrollView.contentOffset = contentOffset;            \
  }                                                       \
  -(type)getter                                           \
  {                                                       \
    return [_scrollView getter];                          \
  }

ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setAlwaysBounceHorizontal, alwaysBounceHorizontal, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setAlwaysBounceVertical, alwaysBounceVertical, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setBounces, bounces, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setBouncesZoom, bouncesZoom, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setCanCancelContentTouches, canCancelContentTouches, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setDecelerationRate, decelerationRate, CGFloat)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setDirectionalLockEnabled, isDirectionalLockEnabled, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setIndicatorStyle, indicatorStyle, UIScrollViewIndicatorStyle)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setKeyboardDismissMode, keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setMaximumZoomScale, maximumZoomScale, CGFloat)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setMinimumZoomScale, minimumZoomScale, CGFloat)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setScrollEnabled, isScrollEnabled, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setPagingEnabled, isPagingEnabled, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setScrollsToTop, scrollsToTop, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setShowsHorizontalScrollIndicator, showsHorizontalScrollIndicator, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setShowsVerticalScrollIndicator, showsVerticalScrollIndicator, BOOL)
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setZoomScale, zoomScale, CGFloat);
ABI47_0_0RCT_SET_AND_PRESERVE_OFFSET(setScrollIndicatorInsets, scrollIndicatorInsets, UIEdgeInsets);

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* __IPHONE_13_0 */
- (void)setAutomaticallyAdjustsScrollIndicatorInsets:(BOOL)automaticallyAdjusts API_AVAILABLE(ios(13.0))
{
  // `automaticallyAdjustsScrollIndicatorInsets` is available since iOS 13.
  if ([_scrollView respondsToSelector:@selector(setAutomaticallyAdjustsScrollIndicatorInsets:)]) {
    if (@available(iOS 13.0, *)) {
      _scrollView.automaticallyAdjustsScrollIndicatorInsets = automaticallyAdjusts;
    }
  }
}
#endif

- (void)setContentInsetAdjustmentBehavior:(UIScrollViewContentInsetAdjustmentBehavior)behavior
{
  CGPoint contentOffset = _scrollView.contentOffset;
  _scrollView.contentInsetAdjustmentBehavior = behavior;
  _scrollView.contentOffset = contentOffset;
}

- (void)sendScrollEventWithName:(NSString *)eventName
                     scrollView:(UIScrollView *)scrollView
                       userData:(NSDictionary *)userData
{
  if (![_lastEmittedEventName isEqualToString:eventName]) {
    _coalescingKey++;
    _lastEmittedEventName = [eventName copy];
  }
  ABI47_0_0RCTScrollEvent *scrollEvent = [[ABI47_0_0RCTScrollEvent alloc] initWithEventName:eventName
                                                                 ABI47_0_0ReactTag:self.ABI47_0_0ReactTag
                                                  scrollViewContentOffset:scrollView.contentOffset
                                                   scrollViewContentInset:scrollView.contentInset
                                                    scrollViewContentSize:scrollView.contentSize
                                                          scrollViewFrame:scrollView.frame
                                                      scrollViewZoomScale:scrollView.zoomScale
                                                                 userData:userData
                                                            coalescingKey:_coalescingKey];
  [_eventDispatcher sendEvent:scrollEvent];
}

@end

void ABI47_0_0RCTSendFakeScrollEvent(id<ABI47_0_0RCTEventDispatcherProtocol> eventDispatcher, NSNumber *ABI47_0_0ReactTag)
{
  // Use the selector here in case the onScroll block property is ever renamed
  NSString *eventName = NSStringFromSelector(@selector(onScroll));
  ABI47_0_0RCTScrollEvent *fakeScrollEvent = [[ABI47_0_0RCTScrollEvent alloc] initWithEventName:eventName
                                                                     ABI47_0_0ReactTag:ABI47_0_0ReactTag
                                                      scrollViewContentOffset:CGPointZero
                                                       scrollViewContentInset:UIEdgeInsetsZero
                                                        scrollViewContentSize:CGSizeZero
                                                              scrollViewFrame:CGRectZero
                                                          scrollViewZoomScale:0
                                                                     userData:nil
                                                                coalescingKey:0];
  [eventDispatcher sendEvent:fakeScrollEvent];
}
