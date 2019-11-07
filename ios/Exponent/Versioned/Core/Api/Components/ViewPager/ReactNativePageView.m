
#import "ReactNativePageView.h"
#import "React/RCTLog.h"
#import <React/RCTViewManager.h>


@interface RCTOnPageScrollEvent : NSObject <RCTEvent>

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset
                    coalescingKey:(uint16_t)coalescingKey;

@end

@implementation RCTOnPageScrollEvent
{
    NSNumber* _position;
    NSNumber* _offset;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScroll";
}

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset
                    coalescingKey:(uint16_t)coalescingKey;
{
    RCTAssertParam(reactTag);
    
    if ((self = [super init])) {
        _viewTag = reactTag;
        _position = position;
        _offset = offset;
        _coalescingKey = coalescingKey;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
- (uint16_t)coalescingKey
{
    return _coalescingKey;
}


- (BOOL)canCoalesce
{
    return NO;
}

+ (NSString *)moduleDotMethod
{
    return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 @"offset": _offset
                 }];
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;
{
    return newEvent;
}

@end

@interface RCTOnPageScrollStateChanged : NSObject <RCTEvent>

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;

@end

@implementation RCTOnPageScrollStateChanged
{
    NSString* _state;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScrollStateChanged";
}

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;
{
    RCTAssertParam(reactTag);
    
    if ((self = [super init])) {
        _viewTag = reactTag;
        _state = state;
        _coalescingKey = coalescingKey;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
- (uint16_t)coalescingKey
{
    return _coalescingKey;
}


- (BOOL)canCoalesce
{
    return NO;
}

+ (NSString *)moduleDotMethod
{
    return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, RCTNormalizeInputEventName(self.eventName), @{
                 @"pageScrollState": _state,
                 }];
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;
{
    return newEvent;
}

@end


@interface RCTOnPageSelected : NSObject <RCTEvent>

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

@implementation RCTOnPageSelected
{
    NSNumber* _position;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageSelected";
}

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;
{
    RCTAssertParam(reactTag);
    
    if ((self = [super init])) {
        _viewTag = reactTag;
        _position = position;
        _coalescingKey = coalescingKey;
    }
    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
- (uint16_t)coalescingKey
{
    return _coalescingKey;
}


- (BOOL)canCoalesce
{
    return NO;
}

+ (NSString *)moduleDotMethod
{
    return @"RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 }];
}

- (id<RCTEvent>)coalesceWithEvent:(id<RCTEvent>)newEvent;
{
    return newEvent;
}

@end


@implementation ReactNativePageView {
    UIPageViewControllerNavigationDirection swipeDirection;
    uint16_t _coalescingKey;
}
- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher {
    self = [super init];
    if (self) {
        _childrenViewControllers = [[NSMutableArray alloc] init];
        _scrollEnabled = YES;
        _pageMargin = 0;
        _transitionStyle = UIPageViewControllerTransitionStyleScroll;
        _orientation = UIPageViewControllerNavigationOrientationHorizontal;
        _currentIndex = 0;
        _dismissKeyboard = UIScrollViewKeyboardDismissModeNone;
        _coalescingKey = 0;
        _eventDispatcher = eventDispatcher;
    }
    return self;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    if (_reactPageViewController) {
        [self shouldScroll:_scrollEnabled];
        //Below line fix bug, where the view does not update after orientation changed.
        [self goTo:[NSNumber numberWithInteger:_currentIndex] animated:NO];
    } else {
        [self embed];
    }
}

- (void)didUpdateReactSubviews {
    if (_childrenViewControllers.count == 0){
        return;
    }
    [self addPages];
}

- (void)addPages {
    if ([self reactViewController]) {
        NSMutableArray<UIViewController *> *tempChildrenViewControllers = [[NSMutableArray alloc] init];
        for (UIView *view in self.reactSubviews) {
            NSPredicate* predicate = [NSPredicate predicateWithFormat:@"view.reactTag == %@", view.reactTag];
            NSArray<UIViewController *> *foundViewControlers = [_childrenViewControllers filteredArrayUsingPredicate:predicate];
            if (foundViewControlers.count > 0){
                [tempChildrenViewControllers addObject:foundViewControlers[0]];
            } else {
                [tempChildrenViewControllers addObject:[self createChildViewController:view]];
            }
        }
        _childrenViewControllers = tempChildrenViewControllers;
        _reactPageIndicatorView.numberOfPages = _childrenViewControllers.count;
        [self goTo:[NSNumber numberWithInteger:_currentIndex] animated:NO];
        
    } else {
        RCTLog(@"getParentViewController returns nil");
    }
}

- (void)embed {
    if ([self reactViewController]) {
        NSDictionary *options = [NSMutableDictionary
                                 dictionaryWithObjectsAndKeys:
                                 [NSNumber numberWithLong:_pageMargin],
                                 UIPageViewControllerOptionInterPageSpacingKey, nil];
        
        UIPageViewController *reactPageViewController =
        [[UIPageViewController alloc]
         initWithTransitionStyle:_transitionStyle
         navigationOrientation:_orientation
         options:options];
        
        _reactPageViewController = reactPageViewController;
        _reactPageViewController.delegate = self;
        _reactPageViewController.dataSource = self;
        
        for (UIView *subview in _reactPageViewController.view.subviews) {
            if([subview isKindOfClass:UIScrollView.class]){
                ((UIScrollView *)subview).delegate = self;
                ((UIScrollView *)subview).keyboardDismissMode = _dismissKeyboard;
            }
        }
        
        [self renderChildrenViewControllers];
        _reactPageIndicatorView = [self createPageIndicator:self];
        _reactPageIndicatorView.hidden = !_showPageIndicator;
        
        [[self reactViewController] addChildViewController:_reactPageViewController];
        
        [reactPageViewController.view addSubview:_reactPageIndicatorView];
        [self addSubview:reactPageViewController.view];
        _reactPageViewController.view.frame = [self bounds];
        
        [_reactPageViewController didMoveToParentViewController:[self reactViewController]];
        
        // Add the page view controller's gesture recognizers to the view controller's view so that the gestures are started more easily.
        self.gestureRecognizers = _reactPageViewController.gestureRecognizers;
    } else {
        RCTLog(@"getParentViewController returns nil");
    }
}

- (void)shouldScroll:(BOOL)scrollEnabled {
    _scrollEnabled = scrollEnabled;
    if (_reactPageViewController.view) {
        for (UIScrollView *view in _reactPageViewController.view.subviews) {
            if ([view isKindOfClass:[UIScrollView class]]) {
                view.scrollEnabled = scrollEnabled;
            }
        }
    }
}

- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard {
    _dismissKeyboard = [dismissKeyboard  isEqual: @"on-drag"] ?
    UIScrollViewKeyboardDismissModeOnDrag : UIScrollViewKeyboardDismissModeNone;
    for (UIView *subview in _reactPageViewController.view.subviews) {
        if([subview isKindOfClass:UIScrollView.class]){
            ((UIScrollView *)subview).keyboardDismissMode = _dismissKeyboard;
        }
    }
}

- (void)renderChildrenViewControllers {
    int index = 0;
    for (UIViewController *vc in _childrenViewControllers) {
        [vc.view removeFromSuperview];
    }
    [_childrenViewControllers removeAllObjects];
    
    for (UIView *view in [self reactSubviews]) {
        [view removeFromSuperview];
        UIViewController *pageViewController = [self createChildViewController:view];
        if (index == _initialPage) {
            [self
             setReactViewControllers:index
             with:pageViewController
             direction:UIPageViewControllerNavigationDirectionForward
             animated:YES];
        }
        [_childrenViewControllers addObject:pageViewController];
        index++;
    }
}

- (void)setReactViewControllers:(NSInteger)index
                           with:(UIViewController *)pageViewController
                      direction:(UIPageViewControllerNavigationDirection)direction
                       animated:(BOOL)animated {
    __weak ReactNativePageView *weakSelf = self;
    uint16_t coalescingKey = _coalescingKey++;
    [_reactPageViewController
     setViewControllers:[NSArray arrayWithObjects:pageViewController, nil]
     direction:direction
     animated:animated
     completion:^(BOOL finished) {
         weakSelf.currentIndex = index;
         if (weakSelf.eventDispatcher) {
             [weakSelf.eventDispatcher sendEvent:[[RCTOnPageSelected alloc] initWithReactTag:weakSelf.reactTag position:[NSNumber numberWithInteger:index] coalescingKey:coalescingKey]];
         }
         
     }];
}

- (UIViewController *)createChildViewController:(UIView *)view {
    UIViewController *childViewController = [[UIViewController alloc] init];
    childViewController.view = view;
    return childViewController;
}

- (void)goTo:(NSNumber *)index animated:(BOOL)animated {
    if (_currentIndex >= 0 &&
        index.integerValue < _childrenViewControllers.count) {
        
        _reactPageIndicatorView.currentPage = index.integerValue;
        UIPageViewControllerNavigationDirection direction =
        (index.integerValue > _currentIndex)
        ? UIPageViewControllerNavigationDirectionForward
        : UIPageViewControllerNavigationDirectionReverse;
        
        UIViewController *viewController =
        [_childrenViewControllers objectAtIndex:index.integerValue];
        [self setReactViewControllers:index.integerValue
                                 with:viewController
                            direction:direction
                             animated:animated];
        
    }
}

#pragma mark - Delegate

- (void)pageViewController:(UIPageViewController *)pageViewController
willTransitionToViewControllers:
(NSArray<UIViewController *> *)pendingViewControllers {
    if (pendingViewControllers.count == 1) {
        NSUInteger index = [_childrenViewControllers indexOfObject:[pendingViewControllers objectAtIndex:0]];
        swipeDirection = (index > _currentIndex)
        ? UIPageViewControllerNavigationDirectionForward
        : UIPageViewControllerNavigationDirectionReverse;
    } else {
        RCTLog(@"Only one screen support");
    }
}

- (void)pageViewController:(UIPageViewController *)pageViewController
        didFinishAnimating:(BOOL)finished
   previousViewControllers: (nonnull NSArray<UIViewController *> *)previousViewControllers
       transitionCompleted:(BOOL)completed {
    UIViewController* currentVC = pageViewController.viewControllers[0];
    _currentIndex = [_childrenViewControllers indexOfObject:currentVC];
    [_eventDispatcher sendEvent:[[RCTOnPageSelected alloc] initWithReactTag:self.reactTag position:[NSNumber numberWithInteger:_currentIndex] coalescingKey:_coalescingKey++]];
    
    [_eventDispatcher sendEvent:[[RCTOnPageScrollEvent alloc] initWithReactTag:self.reactTag position:[NSNumber numberWithInteger:_currentIndex] offset:[NSNumber numberWithFloat:0] coalescingKey:_coalescingKey++]];
    _reactPageIndicatorView.currentPage = _currentIndex;
}

#pragma mark - Datasource After

- (UIViewController *)pageViewController:
(UIPageViewController *)pageViewController
       viewControllerAfterViewController:(UIViewController *)viewController {
    NSUInteger index = [_childrenViewControllers indexOfObject:viewController];
    
    if (index == NSNotFound) {
        return nil;
    }
    
    index++;
    
    if (index == [_childrenViewControllers count]) {
        return nil;
    }
    return [_childrenViewControllers objectAtIndex:index];
}

#pragma mark - Datasource Before

- (UIViewController *)pageViewController:
(UIPageViewController *)pageViewController
      viewControllerBeforeViewController:(UIViewController *)viewController {
    NSUInteger index = [_childrenViewControllers indexOfObject:viewController];
    
    if (index == NSNotFound) {
        return nil;
    }
    
    if (index == 0) {
        return nil;
    }
    
    index--;
    return [_childrenViewControllers objectAtIndex:index];
}

#pragma mark - UIPageControl

- (void)shouldShowPageIndicator:(BOOL)showPageIndicator {
    _showPageIndicator = showPageIndicator;
    if (_reactPageIndicatorView){
        _reactPageIndicatorView.hidden = !showPageIndicator;
    }
}

- (UIPageControl *)createPageIndicator:(UIView *)parentView {
    CGPoint parentOrigin = parentView.frame.origin;
    CGSize parentSize = parentView.frame.size;
    UIPageControl *pageControl = [[UIPageControl alloc]
                                  initWithFrame:(CGRectMake(parentOrigin.x,
                                                            parentSize.height - 70,
                                                            parentSize.width,
                                                            70))];
    pageControl.numberOfPages = _childrenViewControllers.count;
    pageControl.currentPage = _initialPage;
    pageControl.tintColor = UIColor.blackColor;
    pageControl.pageIndicatorTintColor = UIColor.whiteColor;
    pageControl.currentPageIndicatorTintColor = UIColor.blackColor;
    [pageControl addTarget:self
                    action:@selector(pageControlValueChanged:)
          forControlEvents:UIControlEventValueChanged];

    return pageControl;
}
- (void)pageControlValueChanged:(UIPageControl *)sender {
    if (_reactPageIndicatorView.currentPage != _currentIndex) {
        [self goTo:@(_reactPageIndicatorView.currentPage) animated:YES];
    }
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView {
    [_eventDispatcher sendEvent:[[RCTOnPageScrollStateChanged alloc] initWithReactTag:self.reactTag state:@"dragging" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView withVelocity:(CGPoint)velocity targetContentOffset:(inout CGPoint *)targetContentOffset {
    [_eventDispatcher sendEvent:[[RCTOnPageScrollStateChanged alloc] initWithReactTag:self.reactTag state:@"settling" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
    [_eventDispatcher sendEvent:[[RCTOnPageScrollStateChanged alloc] initWithReactTag:self.reactTag state:@"idle" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    CGPoint point = scrollView.contentOffset;
    float offset = (point.x - self.frame.size.width)/self.frame.size.width;
    if(fabs(offset) > 1) {
        offset = offset > 0 ? 1.0 : -1.0;
    }
    [_eventDispatcher sendEvent:[[RCTOnPageScrollEvent alloc] initWithReactTag:self.reactTag position:[NSNumber numberWithInteger:_currentIndex] offset:[NSNumber numberWithFloat:offset] coalescingKey:_coalescingKey++]];
}

@end

