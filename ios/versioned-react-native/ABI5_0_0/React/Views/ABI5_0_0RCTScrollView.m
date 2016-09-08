/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTScrollView.h"

#import <UIKit/UIKit.h>

#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTEventDispatcher.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTRefreshControl.h"
#import "ABI5_0_0RCTUIManager.h"
#import "ABI5_0_0RCTUtils.h"
#import "ABI5_0_0UIView+Private.h"
#import "UIView+ReactABI5_0_0.h"

CGFloat const ZINDEX_DEFAULT = 0;
CGFloat const ZINDEX_STICKY_HEADER = 50;

@interface ABI5_0_0RCTScrollEvent : NSObject <ABI5_0_0RCTEvent>

- (instancetype)initWithType:(ABI5_0_0RCTScrollEventType)type
                    ReactABI5_0_0Tag:(NSNumber *)ReactABI5_0_0Tag
                  scrollView:(UIScrollView *)scrollView
                    userData:(NSDictionary *)userData
               coalescingKey:(uint16_t)coalescingKey NS_DESIGNATED_INITIALIZER;

@end

@implementation ABI5_0_0RCTScrollEvent
{
  ABI5_0_0RCTScrollEventType _type;
  UIScrollView *_scrollView;
  NSDictionary *_userData;
  uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (instancetype)initWithType:(ABI5_0_0RCTScrollEventType)type
                    ReactABI5_0_0Tag:(NSNumber *)ReactABI5_0_0Tag
                  scrollView:(UIScrollView *)scrollView
                    userData:(NSDictionary *)userData
               coalescingKey:(uint16_t)coalescingKey
{
  ABI5_0_0RCTAssertParam(ReactABI5_0_0Tag);

  if ((self = [super init])) {
    _type = type;
    _viewTag = ReactABI5_0_0Tag;
    _scrollView = scrollView;
    _userData = userData;
    _coalescingKey = coalescingKey;
  }
  return self;
}

ABI5_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (uint16_t)coalescingKey
{
  return _coalescingKey;
}

- (NSDictionary *)body
{
  NSDictionary *body = @{
    @"contentOffset": @{
      @"x": @(_scrollView.contentOffset.x),
      @"y": @(_scrollView.contentOffset.y)
    },
    @"contentInset": @{
      @"top": @(_scrollView.contentInset.top),
      @"left": @(_scrollView.contentInset.left),
      @"bottom": @(_scrollView.contentInset.bottom),
      @"right": @(_scrollView.contentInset.right)
    },
    @"contentSize": @{
      @"width": @(_scrollView.contentSize.width),
      @"height": @(_scrollView.contentSize.height)
    },
    @"layoutMeasurement": @{
      @"width": @(_scrollView.frame.size.width),
      @"height": @(_scrollView.frame.size.height)
    },
    @"zoomScale": @(_scrollView.zoomScale ?: 1),
  };

  if (_userData) {
    NSMutableDictionary *mutableBody = [body mutableCopy];
    [mutableBody addEntriesFromDictionary:_userData];
    body = mutableBody;
  }

  return body;
}

- (NSString *)eventName
{
  static NSString *events[] = {
    @"scrollBeginDrag",
    @"scroll",
    @"scrollEndDrag",
    @"momentumScrollBegin",
    @"momentumScrollEnd",
    @"scrollAnimationEnd",
  };

  return events[_type];
}

- (BOOL)canCoalesce
{
  return YES;
}

- (ABI5_0_0RCTScrollEvent *)coalesceWithEvent:(ABI5_0_0RCTScrollEvent *)newEvent
{
  NSArray<NSDictionary *> *updatedChildFrames = [_userData[@"updatedChildFrames"] arrayByAddingObjectsFromArray:newEvent->_userData[@"updatedChildFrames"]];

  if (updatedChildFrames) {
    NSMutableDictionary *userData = [newEvent->_userData mutableCopy];
    userData[@"updatedChildFrames"] = updatedChildFrames;
    newEvent->_userData = userData;
  }

  return newEvent;
}

+ (NSString *)moduleDotMethod
{
  return @"ABI5_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
  return @[self.viewTag, ABI5_0_0RCTNormalizeInputEventName(self.eventName), [self body]];
}

@end

/**
 * Include a custom scroll view subclass because we want to limit certain
 * default UIKit behaviors such as textFields automatically scrolling
 * scroll views that contain them and support sticky headers.
 */
@interface ABI5_0_0RCTCustomScrollView : UIScrollView<UIGestureRecognizerDelegate>

@property (nonatomic, copy) NSIndexSet *stickyHeaderIndices;
@property (nonatomic, assign) BOOL centerContent;
@property (nonatomic, strong) ABI5_0_0RCTRefreshControl *reactRefreshControl;

@end


@implementation ABI5_0_0RCTCustomScrollView
{
  __weak UIView *_dockedHeaderView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self.panGestureRecognizer addTarget:self action:@selector(handleCustomPan:)];
  }
  return self;
}

- (UIView *)contentView
{
  return ((ABI5_0_0RCTScrollView *)self.superview).contentView;
}

/**
 * @return Whether or not the scroll view interaction should be blocked because
 * JS was found to be the responder.
 */
- (BOOL)_shouldDisableScrollInteraction
{
  // Since this may be called on every pan, we need to make sure to only climb
  // the hierarchy on rare occasions.
  UIView *JSResponder = [ABI5_0_0RCTUIManager JSResponder];
  if (JSResponder && JSResponder != self.superview) {
    BOOL superviewHasResponder = [self isDescendantOfView:JSResponder];
    return superviewHasResponder;
  }
  return NO;
}

- (void)handleCustomPan:(__unused UIPanGestureRecognizer *)sender
{
  if ([self _shouldDisableScrollInteraction] && ![[ABI5_0_0RCTUIManager JSResponder] isKindOfClass:[ABI5_0_0RCTScrollView class]]) {
    self.panGestureRecognizer.enabled = NO;
    self.panGestureRecognizer.enabled = YES;
    // TODO: If mid bounce, animate the scroll view to a non-bounced position
    // while disabling (but only if `stopScrollInteractionIfJSHasResponder` was
    // called *during* a `pan`. Currently, it will just snap into place which
    // is not so bad either.
    // Another approach:
    // self.scrollEnabled = NO;
    // self.scrollEnabled = YES;
  }
}

- (void)scrollRectToVisible:(__unused CGRect)rect animated:(__unused BOOL)animated
{
  // noop
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
 * touch started inside of a `UIControl` (`UIButton` etc). For ReactABI5_0_0 scroll
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
 * Chat with andras for more details.
 *
 * In order to have this called, you must have delaysContentTouches set to NO
 * (which is the not the `UIKit` default).
 */
- (BOOL)touchesShouldCancelInContentView:(__unused UIView *)view
{
  //TODO: shouldn't this call super if _shouldDisableScrollInteraction returns NO?
  return ![self _shouldDisableScrollInteraction];
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
  if (contentView && _centerContent) {
    CGSize subviewSize = contentView.frame.size;
    CGSize scrollViewSize = self.bounds.size;
    if (subviewSize.width < scrollViewSize.width) {
      contentOffset.x = -(scrollViewSize.width - subviewSize.width) / 2.0;
    }
    if (subviewSize.height < scrollViewSize.height) {
      contentOffset.y = -(scrollViewSize.height - subviewSize.height) / 2.0;
    }
  }
  super.contentOffset = contentOffset;
}

- (void)dockClosestSectionHeader
{
  UIView *contentView = [self contentView];
  CGFloat scrollTop = self.bounds.origin.y + self.contentInset.top;
  // If the RefreshControl is refreshing, remove it's height so sticky headers are
  // positioned properly when scrolling down while refreshing.
  if (self.reactRefreshControl != nil && self.reactRefreshControl.refreshing) {
    scrollTop -= self.reactRefreshControl.frame.size.height;
  }

  // Find the section headers that need to be docked
  __block UIView *previousHeader = nil;
  __block UIView *currentHeader = nil;
  __block UIView *nextHeader = nil;
  NSUInteger subviewCount = contentView.ReactABI5_0_0Subviews.count;
  [_stickyHeaderIndices enumerateIndexesWithOptions:0 usingBlock:
   ^(NSUInteger idx, BOOL *stop) {

    // If the subviews are out of sync with the sticky header indices don't
    // do anything.
    if (idx >= subviewCount) {
      *stop = YES;
      return;
    }

    UIView *header = contentView.ReactABI5_0_0Subviews[idx];

    // If nextHeader not yet found, search for docked headers
    if (!nextHeader) {
      CGFloat height = header.bounds.size.height;
      CGFloat top = header.center.y - height * header.layer.anchorPoint.y;
      if (top > scrollTop) {
        nextHeader = header;
      } else {
        previousHeader = currentHeader;
        currentHeader = header;
      }
    }

    // Reset transforms for header views
    header.transform = CGAffineTransformIdentity;
    header.layer.zPosition = ZINDEX_DEFAULT;

  }];

  // If no docked header, bail out
  if (!currentHeader) {
    return;
  }

  // Adjust current header to hug the top of the screen
  CGFloat currentFrameHeight = currentHeader.bounds.size.height;
  CGFloat currentFrameTop = currentHeader.center.y - currentFrameHeight * currentHeader.layer.anchorPoint.y;
  CGFloat yOffset = scrollTop - currentFrameTop;
  if (nextHeader) {
    // The next header nudges the current header out of the way when it reaches
    // the top of the screen
    CGFloat nextFrameHeight = nextHeader.bounds.size.height;
    CGFloat nextFrameTop = nextHeader.center.y - nextFrameHeight * nextHeader.layer.anchorPoint.y;
    CGFloat overlap = currentFrameHeight - (nextFrameTop - scrollTop);
    yOffset -= MAX(0, overlap);
  }
  currentHeader.transform = CGAffineTransformMakeTranslation(0, yOffset);
  currentHeader.layer.zPosition = ZINDEX_STICKY_HEADER;
  _dockedHeaderView = currentHeader;

  if (previousHeader) {
    // The previous header sits right above the currentHeader's initial position
    // so it scrolls away nicely once the currentHeader has locked into place
    CGFloat previousFrameHeight = previousHeader.bounds.size.height;
    CGFloat targetCenter = currentFrameTop - previousFrameHeight * (1.0 - previousHeader.layer.anchorPoint.y);
    yOffset = targetCenter - previousHeader.center.y;
    previousHeader.transform = CGAffineTransformMakeTranslation(0, yOffset);
    previousHeader.layer.zPosition = ZINDEX_STICKY_HEADER;
  }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  if (_dockedHeaderView && [self pointInside:point withEvent:event]) {
    CGPoint convertedPoint = [_dockedHeaderView convertPoint:point fromView:self];
    UIView *hitView = [_dockedHeaderView hitTest:convertedPoint withEvent:event];
    if (hitView) {
      return hitView;
    }
  }
  return [super hitTest:point withEvent:event];
}

- (void)setReactRefreshControl:(ABI5_0_0RCTRefreshControl *)refreshControl
{
  if (_reactRefreshControl) {
    [_reactRefreshControl removeFromSuperview];
  }
  _reactRefreshControl = refreshControl;
  [self addSubview:_reactRefreshControl];
}

@end

@implementation ABI5_0_0RCTScrollView
{
  ABI5_0_0RCTEventDispatcher *_eventDispatcher;
  ABI5_0_0RCTCustomScrollView *_scrollView;
  UIView *_contentView;
  NSTimeInterval _lastScrollDispatchTime;
  NSMutableArray<NSValue *> *_cachedChildFrames;
  BOOL _allowNextScrollNoMatterWhat;
  CGRect _lastClippedToRect;
  uint16_t _coalescingKey;
  ABI5_0_0RCTScrollEventType _lastEmittedEventType;
}

@synthesize nativeScrollDelegate = _nativeScrollDelegate;

- (instancetype)initWithEventDispatcher:(ABI5_0_0RCTEventDispatcher *)eventDispatcher
{
  ABI5_0_0RCTAssertParam(eventDispatcher);

  if ((self = [super initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
    _scrollView = [[ABI5_0_0RCTCustomScrollView alloc] initWithFrame:CGRectZero];
    _scrollView.delegate = self;
    _scrollView.delaysContentTouches = NO;
    _automaticallyAdjustContentInsets = YES;
    _contentInset = UIEdgeInsetsZero;
    _contentSize = CGSizeZero;
    _lastClippedToRect = CGRectNull;

    _scrollEventThrottle = 0.0;
    _lastScrollDispatchTime = CACurrentMediaTime();
    _cachedChildFrames = [NSMutableArray new];

    [self addSubview:_scrollView];
  }
  return self;
}

ABI5_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI5_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)setRemoveClippedSubviews:(__unused BOOL)removeClippedSubviews
{
  // Does nothing
}

- (void)insertReactABI5_0_0Subview:(UIView *)view atIndex:(__unused NSInteger)atIndex
{
  if ([view isKindOfClass:[ABI5_0_0RCTRefreshControl class]]) {
    _scrollView.reactRefreshControl = (ABI5_0_0RCTRefreshControl*)view;
  } else {
    ABI5_0_0RCTAssert(_contentView == nil, @"ABI5_0_0RCTScrollView may only contain a single subview");
    _contentView = view;
    [_scrollView addSubview:view];
  }
}

- (void)removeReactABI5_0_0Subview:(UIView *)subview
{
  if ([subview isKindOfClass:[ABI5_0_0RCTRefreshControl class]]) {
    _scrollView.reactRefreshControl = nil;
  } else {
    ABI5_0_0RCTAssert(_contentView == subview, @"Attempted to remove non-existent subview");
    _contentView = nil;
    [subview removeFromSuperview];
  }
}

- (NSArray<UIView *> *)ReactABI5_0_0Subviews
{
  if (_contentView && _scrollView.reactRefreshControl) {
    return @[_contentView, _scrollView.reactRefreshControl];
  }
  return _contentView ? @[_contentView] : @[];
}

- (BOOL)centerContent
{
  return _scrollView.centerContent;
}

- (void)setCenterContent:(BOOL)centerContent
{
  _scrollView.centerContent = centerContent;
}

- (NSIndexSet *)stickyHeaderIndices
{
  return _scrollView.stickyHeaderIndices;
}

- (void)setStickyHeaderIndices:(NSIndexSet *)headerIndices
{
  ABI5_0_0RCTAssert(_scrollView.contentSize.width <= self.frame.size.width,
           @"sticky headers are not supported with horizontal scrolled views");
  _scrollView.stickyHeaderIndices = headerIndices;
}

- (void)setClipsToBounds:(BOOL)clipsToBounds
{
  super.clipsToBounds = clipsToBounds;
  _scrollView.clipsToBounds = clipsToBounds;
}

- (void)dealloc
{
  _scrollView.delegate = nil;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  ABI5_0_0RCTAssert(self.subviews.count == 1, @"we should only have exactly one subview");
  ABI5_0_0RCTAssert([self.subviews lastObject] == _scrollView, @"our only subview should be a scrollview");

  CGPoint originalOffset = _scrollView.contentOffset;
  _scrollView.frame = self.bounds;
  _scrollView.contentOffset = originalOffset;

  // Adjust the refresh control frame if the scrollview layout changes.
  ABI5_0_0RCTRefreshControl *refreshControl = _scrollView.reactRefreshControl;
  if (refreshControl && refreshControl.refreshing) {
    refreshControl.frame = (CGRect){_scrollView.contentOffset, {_scrollView.frame.size.width, refreshControl.frame.size.height}};
  }

  [self updateClippedSubviews];
}

- (void)updateClippedSubviews
{
  // Find a suitable view to use for clipping
  UIView *clipView = [self ReactABI5_0_0_findClipView];
  if (!clipView) {
    return;
  }

  static const CGFloat leeway = 1.0;

  const CGSize contentSize = _scrollView.contentSize;
  const CGRect bounds = _scrollView.bounds;
  const BOOL scrollsHorizontally = contentSize.width > bounds.size.width;
  const BOOL scrollsVertically = contentSize.height > bounds.size.height;

  const BOOL shouldClipAgain =
    CGRectIsNull(_lastClippedToRect) ||
    (scrollsHorizontally && (bounds.size.width < leeway || fabs(_lastClippedToRect.origin.x - bounds.origin.x) >= leeway)) ||
    (scrollsVertically && (bounds.size.height < leeway || fabs(_lastClippedToRect.origin.y - bounds.origin.y) >= leeway));

  if (shouldClipAgain) {
    const CGRect clipRect = CGRectInset(clipView.bounds, -leeway, -leeway);
    [self ReactABI5_0_0_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
    _lastClippedToRect = bounds;
  }
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  CGPoint contentOffset = _scrollView.contentOffset;

  _contentInset = contentInset;
  [ABI5_0_0RCTView autoAdjustInsetsForView:self
                    withScrollView:_scrollView
                      updateOffset:NO];

  _scrollView.contentOffset = contentOffset;
}

- (void)scrollToOffset:(CGPoint)offset
{
  [self scrollToOffset:offset animated:YES];
}

- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated
{
  if (!CGPointEqualToPoint(_scrollView.contentOffset, offset)) {
    [_scrollView setContentOffset:offset animated:animated];
  }
}

- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated
{
  [_scrollView zoomToRect:rect animated:animated];
}

- (void)refreshContentInset
{
  [ABI5_0_0RCTView autoAdjustInsetsForView:self
                    withScrollView:_scrollView
                      updateOffset:YES];
}

#pragma mark - ScrollView delegate

#define ABI5_0_0RCT_SCROLL_EVENT_HANDLER(delegateMethod, eventName) \
- (void)delegateMethod:(UIScrollView *)scrollView           \
{                                                           \
  [self sendScrollEventWithType:eventName ReactABI5_0_0Tag:self.ReactABI5_0_0Tag scrollView:scrollView userData:nil]; \
  if ([_nativeScrollDelegate respondsToSelector:_cmd]) { \
    [_nativeScrollDelegate delegateMethod:scrollView]; \
  } \
}

#define ABI5_0_0RCT_FORWARD_SCROLL_EVENT(call) \
if ([_nativeScrollDelegate respondsToSelector:_cmd]) { \
  [_nativeScrollDelegate call]; \
}

ABI5_0_0RCT_SCROLL_EVENT_HANDLER(scrollViewDidEndScrollingAnimation, ABI5_0_0RCTScrollEventTypeEndDeceleration)
ABI5_0_0RCT_SCROLL_EVENT_HANDLER(scrollViewWillBeginDecelerating, ABI5_0_0RCTScrollEventTypeStartDeceleration)
ABI5_0_0RCT_SCROLL_EVENT_HANDLER(scrollViewDidEndDecelerating, ABI5_0_0RCTScrollEventTypeEndDeceleration)
ABI5_0_0RCT_SCROLL_EVENT_HANDLER(scrollViewDidZoom, ABI5_0_0RCTScrollEventTypeMove)

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  [_scrollView dockClosestSectionHeader];
  [self updateClippedSubviews];

  NSTimeInterval now = CACurrentMediaTime();

  /**
   * TODO: this logic looks wrong, and it may be because it is. Currently, if _scrollEventThrottle
   * is set to zero (the default), the "didScroll" event is only sent once per scroll, instead of repeatedly
   * while scrolling as expected. However, if you "fix" that bug, ScrollView will generate repeated
   * warnings, and behave strangely (ListView works fine however), so don't fix it unless you fix that too!
   */
  if (_allowNextScrollNoMatterWhat ||
      (_scrollEventThrottle > 0 && _scrollEventThrottle < (now - _lastScrollDispatchTime))) {

    // Calculate changed frames
    NSArray<NSDictionary *> *childFrames = [self calculateChildFramesData];

    // Dispatch event
    [self sendScrollEventWithType:ABI5_0_0RCTScrollEventTypeMove
                                     ReactABI5_0_0Tag:self.ReactABI5_0_0Tag
                                   scrollView:scrollView
                                     userData:@{@"updatedChildFrames": childFrames}];

    // Update dispatch time
    _lastScrollDispatchTime = now;
    _allowNextScrollNoMatterWhat = NO;
  }
  ABI5_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewDidScroll:scrollView);
}

- (NSArray<NSDictionary *> *)calculateChildFramesData
{
    NSMutableArray<NSDictionary *> *updatedChildFrames = [NSMutableArray new];
    [[_contentView ReactABI5_0_0Subviews] enumerateObjectsUsingBlock:
     ^(UIView *subview, NSUInteger idx, __unused BOOL *stop) {

      // Check if new or changed
      CGRect newFrame = subview.frame;
      BOOL frameChanged = NO;
      if (_cachedChildFrames.count <= idx) {
        frameChanged = YES;
        [_cachedChildFrames addObject:[NSValue valueWithCGRect:newFrame]];
      } else if (!CGRectEqualToRect(newFrame, [_cachedChildFrames[idx] CGRectValue])) {
        frameChanged = YES;
        _cachedChildFrames[idx] = [NSValue valueWithCGRect:newFrame];
      }

      // Create JS frame object
      if (frameChanged) {
        [updatedChildFrames addObject: @{
          @"index": @(idx),
          @"x": @(newFrame.origin.x),
          @"y": @(newFrame.origin.y),
          @"width": @(newFrame.size.width),
          @"height": @(newFrame.size.height),
        }];
      }
    }];

    return updatedChildFrames;
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  _allowNextScrollNoMatterWhat = YES; // Ensure next scroll event is recorded, regardless of throttle
  [self sendScrollEventWithType:ABI5_0_0RCTScrollEventTypeStart ReactABI5_0_0Tag:self.ReactABI5_0_0Tag scrollView:scrollView userData:nil];
  ABI5_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewWillBeginDragging:scrollView);
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView withVelocity:(CGPoint)velocity targetContentOffset:(inout CGPoint *)targetContentOffset
{


  // snapToInterval
  // An alternative to enablePaging which allows setting custom stopping intervals,
  // smaller than a full page size. Often seen in apps which feature horizonally
  // scrolling items. snapToInterval does not enforce scrolling one interval at a time
  // but guarantees that the scroll will stop at an interval point.
  if (self.snapToInterval) {
    CGFloat snapToIntervalF = (CGFloat)self.snapToInterval;

    // Find which axis to snap
    BOOL isHorizontal = (scrollView.contentSize.width > self.frame.size.width);

    // What is the current offset?
    CGFloat targetContentOffsetAlongAxis = isHorizontal ? targetContentOffset->x : targetContentOffset->y;

    // Which direction is the scroll travelling?
    CGPoint translation = [scrollView.panGestureRecognizer translationInView:scrollView];
    CGFloat translationAlongAxis = isHorizontal ? translation.x : translation.y;

    // Offset based on desired alignment
    CGFloat frameLength = isHorizontal ? self.frame.size.width : self.frame.size.height;
    CGFloat alignmentOffset = 0.0f;
    if ([self.snapToAlignment  isEqualToString: @"center"]) {
      alignmentOffset = (frameLength * 0.5f) + (snapToIntervalF * 0.5f);
    } else if ([self.snapToAlignment  isEqualToString: @"end"]) {
      alignmentOffset = frameLength;
    }

    // Pick snap point based on direction and proximity
    NSInteger snapIndex = floor((targetContentOffsetAlongAxis + alignmentOffset) / snapToIntervalF);
    snapIndex = (translationAlongAxis < 0) ? snapIndex + 1 : snapIndex;
    CGFloat newTargetContentOffset = ( snapIndex * snapToIntervalF ) - alignmentOffset;

    // Set new targetContentOffset
    if (isHorizontal) {
      targetContentOffset->x = newTargetContentOffset;
    } else {
      targetContentOffset->y = newTargetContentOffset;
    }
  }

  NSDictionary *userData = @{
    @"velocity": @{
      @"x": @(velocity.x),
      @"y": @(velocity.y)
    },
    @"targetContentOffset": @{
      @"x": @(targetContentOffset->x),
      @"y": @(targetContentOffset->y)
    }
  };
  [self sendScrollEventWithType:ABI5_0_0RCTScrollEventTypeEnd ReactABI5_0_0Tag:self.ReactABI5_0_0Tag scrollView:scrollView userData:userData];

  ABI5_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewWillEndDragging:scrollView withVelocity:velocity targetContentOffset:targetContentOffset);
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
  ABI5_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewDidEndDragging:scrollView willDecelerate:decelerate);
}

- (void)scrollViewWillBeginZooming:(UIScrollView *)scrollView withView:(UIView *)view
{
  [self sendScrollEventWithType:ABI5_0_0RCTScrollEventTypeStart ReactABI5_0_0Tag:self.ReactABI5_0_0Tag scrollView:scrollView userData:nil];
  ABI5_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewWillBeginZooming:scrollView withView:view);
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(UIView *)view atScale:(CGFloat)scale
{
  [self sendScrollEventWithType:ABI5_0_0RCTScrollEventTypeEnd ReactABI5_0_0Tag:self.ReactABI5_0_0Tag scrollView:scrollView userData:nil];
  ABI5_0_0RCT_FORWARD_SCROLL_EVENT(scrollViewDidEndZooming:scrollView withView:view atScale:scale);
}

- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView
{
  if ([_nativeScrollDelegate respondsToSelector:_cmd]) {
    return [_nativeScrollDelegate scrollViewShouldScrollToTop:scrollView];
  }
  return YES;
}

- (UIView *)viewForZoomingInScrollView:(__unused UIScrollView *)scrollView
{
  return _contentView;
}

#pragma mark - Setters

- (CGSize)_calculateViewportSize
{
  CGSize viewportSize = self.bounds.size;
  if (_automaticallyAdjustContentInsets) {
    UIEdgeInsets contentInsets = [ABI5_0_0RCTView contentInsetsForView:self];
    viewportSize = CGSizeMake(self.bounds.size.width - contentInsets.left - contentInsets.right,
                                self.bounds.size.height - contentInsets.top - contentInsets.bottom);
  }
  return viewportSize;
}

- (CGPoint)calculateOffsetForContentSize:(CGSize)newContentSize
{
  CGPoint oldOffset = _scrollView.contentOffset;
  CGPoint newOffset = oldOffset;

  CGSize oldContentSize = _scrollView.contentSize;
  CGSize viewportSize = [self _calculateViewportSize];

  BOOL fitsinViewportY = oldContentSize.height <= viewportSize.height && newContentSize.height <= viewportSize.height;
  if (newContentSize.height < oldContentSize.height && !fitsinViewportY) {
    CGFloat offsetHeight = oldOffset.y + viewportSize.height;
    if (oldOffset.y < 0) {
      // overscrolled on top, leave offset alone
    } else if (offsetHeight > oldContentSize.height) {
      // overscrolled on the bottom, preserve overscroll amount
      newOffset.y = MAX(0, oldOffset.y - (oldContentSize.height - newContentSize.height));
    } else if (offsetHeight > newContentSize.height) {
      // offset falls outside of bounds, scroll back to end of list
      newOffset.y = MAX(0, newContentSize.height - viewportSize.height);
    }
  }

  BOOL fitsinViewportX = oldContentSize.width <= viewportSize.width && newContentSize.width <= viewportSize.width;
  if (newContentSize.width < oldContentSize.width && !fitsinViewportX) {
    CGFloat offsetHeight = oldOffset.x + viewportSize.width;
    if (oldOffset.x < 0) {
      // overscrolled at the beginning, leave offset alone
    } else if (offsetHeight > oldContentSize.width && newContentSize.width > viewportSize.width) {
      // overscrolled at the end, preserve overscroll amount as much as possible
      newOffset.x = MAX(0, oldOffset.x - (oldContentSize.width - newContentSize.width));
    } else if (offsetHeight > newContentSize.width) {
      // offset falls outside of bounds, scroll back to end
      newOffset.x = MAX(0, newContentSize.width - viewportSize.width);
    }
  }

  // all other cases, offset doesn't change
  return newOffset;
}

/**
 * Once you set the `contentSize`, to a nonzero value, it is assumed to be
 * managed by you, and we'll never automatically compute the size for you,
 * unless you manually reset it back to {0, 0}
 */
- (CGSize)contentSize
{
  if (!CGSizeEqualToSize(_contentSize, CGSizeZero)) {
    return _contentSize;
  } else if (!_contentView) {
    return CGSizeZero;
  } else {
    CGSize singleSubviewSize = _contentView.frame.size;
    CGPoint singleSubviewPosition = _contentView.frame.origin;
    return (CGSize){
      singleSubviewSize.width + singleSubviewPosition.x,
      singleSubviewSize.height + singleSubviewPosition.y
    };
  }
}

- (void)ReactABI5_0_0BridgeDidFinishTransaction
{
  CGSize contentSize = self.contentSize;
  if (!CGSizeEqualToSize(_scrollView.contentSize, contentSize)) {
    // When contentSize is set manually, ScrollView internals will reset
    // contentOffset to  {0, 0}. Since we potentially set contentSize whenever
    // anything in the ScrollView updates, we workaround this issue by manually
    // adjusting contentOffset whenever this happens
    CGPoint newOffset = [self calculateOffsetForContentSize:contentSize];
    _scrollView.contentSize = contentSize;
    _scrollView.contentOffset = newOffset;
  }

  if (ABI5_0_0RCT_DEBUG) {
    // Validate that sticky headers are not out of range.
    NSUInteger subviewCount = _scrollView.contentView.ReactABI5_0_0Subviews.count;
    NSUInteger lastIndex = NSNotFound;
    if (_scrollView.stickyHeaderIndices != nil) {
      lastIndex = _scrollView.stickyHeaderIndices.lastIndex;
    }
    if (lastIndex != NSNotFound && lastIndex >= subviewCount) {
      ABI5_0_0RCTLogWarn(@"Sticky header index %zd was outside the range {0, %zd}",
                 lastIndex, subviewCount);
    }
  }

  [_scrollView dockClosestSectionHeader];
}

// Note: setting several properties of UIScrollView has the effect of
// resetting its contentOffset to {0, 0}. To prevent this, we generate
// setters here that will record the contentOffset beforehand, and
// restore it after the property has been set.

#define ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setter, getter, type) \
- (void)setter:(type)value                                \
{                                                         \
  CGPoint contentOffset = _scrollView.contentOffset;      \
  [_scrollView setter:value];                             \
  _scrollView.contentOffset = contentOffset;              \
}                                                         \
- (type)getter                                            \
{                                                         \
  return [_scrollView getter];                            \
}

ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setAlwaysBounceHorizontal, alwaysBounceHorizontal, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setAlwaysBounceVertical, alwaysBounceVertical, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setBounces, bounces, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setBouncesZoom, bouncesZoom, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setCanCancelContentTouches, canCancelContentTouches, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setDecelerationRate, decelerationRate, CGFloat)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setDirectionalLockEnabled, isDirectionalLockEnabled, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setIndicatorStyle, indicatorStyle, UIScrollViewIndicatorStyle)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setKeyboardDismissMode, keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setMaximumZoomScale, maximumZoomScale, CGFloat)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setMinimumZoomScale, minimumZoomScale, CGFloat)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setPagingEnabled, isPagingEnabled, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setScrollEnabled, isScrollEnabled, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setScrollsToTop, scrollsToTop, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setShowsHorizontalScrollIndicator, showsHorizontalScrollIndicator, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setShowsVerticalScrollIndicator, showsVerticalScrollIndicator, BOOL)
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setZoomScale, zoomScale, CGFloat);
ABI5_0_0RCT_SET_AND_PRESERVE_OFFSET(setScrollIndicatorInsets, scrollIndicatorInsets, UIEdgeInsets);

- (void)setOnRefreshStart:(ABI5_0_0RCTDirectEventBlock)onRefreshStart
{
  if (!onRefreshStart) {
    _onRefreshStart = nil;
    _scrollView.reactRefreshControl = nil;
    return;
  }
  _onRefreshStart = [onRefreshStart copy];

  if (!_scrollView.reactRefreshControl) {
    ABI5_0_0RCTRefreshControl *refreshControl = [ABI5_0_0RCTRefreshControl new];
    [refreshControl addTarget:self action:@selector(refreshControlValueChanged) forControlEvents:UIControlEventValueChanged];
    _scrollView.reactRefreshControl = refreshControl;
  }
}

- (void)refreshControlValueChanged
{
  if (self.onRefreshStart) {
    self.onRefreshStart(nil);
  }
}

- (void)endRefreshing
{
  [_scrollView.reactRefreshControl endRefreshing];
}

- (void)sendScrollEventWithType:(ABI5_0_0RCTScrollEventType)type
                       ReactABI5_0_0Tag:(NSNumber *)ReactABI5_0_0Tag
                     scrollView:(UIScrollView *)scrollView
                       userData:(NSDictionary *)userData
{
  if (_lastEmittedEventType != type) {
    _coalescingKey++;
    _lastEmittedEventType = type;
  }
  ABI5_0_0RCTScrollEvent *scrollEvent = [[ABI5_0_0RCTScrollEvent alloc] initWithType:type
                                                            ReactABI5_0_0Tag:ReactABI5_0_0Tag
                                                          scrollView:scrollView
                                                            userData:userData
                                                       coalescingKey:_coalescingKey];
  [_eventDispatcher sendEvent:scrollEvent];
}

@end

@implementation ABI5_0_0RCTEventDispatcher (ABI5_0_0RCTScrollView)

- (void)sendFakeScrollEvent:(NSNumber *)ReactABI5_0_0Tag
{
  ABI5_0_0RCTScrollEvent *fakeScrollEvent = [[ABI5_0_0RCTScrollEvent alloc] initWithType:ABI5_0_0RCTScrollEventTypeMove
                                                            ReactABI5_0_0Tag:ReactABI5_0_0Tag
                                                          scrollView:nil
                                                            userData:nil
                                                       coalescingKey:0];
  [self sendEvent:fakeScrollEvent];
}

@end
