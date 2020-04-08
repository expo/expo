
#import "ABI37_0_0ReactNativePageView.h"
#import "ABI37_0_0React/ABI37_0_0RCTLog.h"
#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>


@interface ABI37_0_0RCTOnPageScrollEvent : NSObject <ABI37_0_0RCTEvent>

- (instancetype) initWithABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset
                    coalescingKey:(uint16_t)coalescingKey;

@end

@implementation ABI37_0_0RCTOnPageScrollEvent
{
    NSNumber* _position;
    NSNumber* _offset;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScroll";
}

- (instancetype) initWithABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset
                    coalescingKey:(uint16_t)coalescingKey;
{
    ABI37_0_0RCTAssertParam(ABI37_0_0ReactTag);
    
    if ((self = [super init])) {
        _viewTag = ABI37_0_0ReactTag;
        _position = position;
        _offset = offset;
        _coalescingKey = coalescingKey;
    }
    return self;
}

ABI37_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
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
    return @"ABI37_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI37_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 @"offset": _offset
                 }];
}

- (id<ABI37_0_0RCTEvent>)coalesceWithEvent:(id<ABI37_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end

@interface ABI37_0_0RCTOnPageScrollStateChanged : NSObject <ABI37_0_0RCTEvent>

- (instancetype) initWithABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;

@end

@implementation ABI37_0_0RCTOnPageScrollStateChanged
{
    NSString* _state;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageScrollStateChanged";
}

- (instancetype) initWithABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;
{
    ABI37_0_0RCTAssertParam(ABI37_0_0ReactTag);
    
    if ((self = [super init])) {
        _viewTag = ABI37_0_0ReactTag;
        _state = state;
        _coalescingKey = coalescingKey;
    }
    return self;
}

ABI37_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
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
    return @"ABI37_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI37_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"pageScrollState": _state,
                 }];
}

- (id<ABI37_0_0RCTEvent>)coalesceWithEvent:(id<ABI37_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end


@interface ABI37_0_0RCTOnPageSelected : NSObject <ABI37_0_0RCTEvent>

- (instancetype) initWithABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

@implementation ABI37_0_0RCTOnPageSelected
{
    NSNumber* _position;
    uint16_t _coalescingKey;
}

@synthesize viewTag = _viewTag;

- (NSString *)eventName {
    return @"onPageSelected";
}

- (instancetype) initWithABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;
{
    ABI37_0_0RCTAssertParam(ABI37_0_0ReactTag);
    
    if ((self = [super init])) {
        _viewTag = ABI37_0_0ReactTag;
        _position = position;
        _coalescingKey = coalescingKey;
    }
    return self;
}

ABI37_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)
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
    return @"ABI37_0_0RCTEventEmitter.receiveEvent";
}

- (NSArray *)arguments
{
    return @[self.viewTag, ABI37_0_0RCTNormalizeInputEventName(self.eventName), @{
                 @"position": _position,
                 }];
}

- (id<ABI37_0_0RCTEvent>)coalesceWithEvent:(id<ABI37_0_0RCTEvent>)newEvent;
{
    return newEvent;
}

@end


@implementation ABI37_0_0ReactNativePageView {
    UIPageViewControllerNavigationDirection swipeDirection;
    uint16_t _coalescingKey;
}
- (instancetype)initWithEventDispatcher:(ABI37_0_0RCTEventDispatcher *)eventDispatcher {
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
    if (_ABI37_0_0ReactPageViewController) {
        [self shouldScroll:_scrollEnabled];
        //Below line fix bug, where the view does not update after orientation changed.
        [self goTo:[NSNumber numberWithInteger:_currentIndex] animated:NO];
    } else {
        [self embed];
    }
}

- (void)didUpdateABI37_0_0ReactSubviews {
    if (_childrenViewControllers.count == 0){
        return;
    }
    [self addPages];
}

- (void)addPages {
    if ([self ABI37_0_0ReactViewController]) {
        NSMutableArray<UIViewController *> *tempChildrenViewControllers = [[NSMutableArray alloc] init];
        for (UIView *view in self.ABI37_0_0ReactSubviews) {
            NSPredicate* predicate = [NSPredicate predicateWithFormat:@"view.ABI37_0_0ReactTag == %@", view.ABI37_0_0ReactTag];
            NSArray<UIViewController *> *foundViewControlers = [_childrenViewControllers filteredArrayUsingPredicate:predicate];
            if (foundViewControlers.count > 0){
                [tempChildrenViewControllers addObject:foundViewControlers[0]];
            } else {
                [tempChildrenViewControllers addObject:[self createChildViewController:view]];
            }
        }
        _childrenViewControllers = tempChildrenViewControllers;
        _ABI37_0_0ReactPageIndicatorView.numberOfPages = _childrenViewControllers.count;
        [self goTo:[NSNumber numberWithInteger:_currentIndex] animated:NO];
        
    } else {
        ABI37_0_0RCTLog(@"getParentViewController returns nil");
    }
}

- (void)embed {
    if ([self ABI37_0_0ReactViewController]) {
        NSDictionary *options = [NSMutableDictionary
                                 dictionaryWithObjectsAndKeys:
                                 [NSNumber numberWithLong:_pageMargin],
                                 UIPageViewControllerOptionInterPageSpacingKey, nil];
        
        UIPageViewController *ABI37_0_0ReactPageViewController =
        [[UIPageViewController alloc]
         initWithTransitionStyle:_transitionStyle
         navigationOrientation:_orientation
         options:options];
        
        _ABI37_0_0ReactPageViewController = ABI37_0_0ReactPageViewController;
        _ABI37_0_0ReactPageViewController.delegate = self;
        _ABI37_0_0ReactPageViewController.dataSource = self;
        
        for (UIView *subview in _ABI37_0_0ReactPageViewController.view.subviews) {
            if([subview isKindOfClass:UIScrollView.class]){
                ((UIScrollView *)subview).delegate = self;
                ((UIScrollView *)subview).keyboardDismissMode = _dismissKeyboard;
                ((UIScrollView *)subview).delaysContentTouches = NO;
            }
        }
        
        [self renderChildrenViewControllers];
        _ABI37_0_0ReactPageIndicatorView = [self createPageIndicator:self];
        _ABI37_0_0ReactPageIndicatorView.hidden = !_showPageIndicator;
    
        [[self ABI37_0_0ReactViewController] addChildViewController:_ABI37_0_0ReactPageViewController];
        [ABI37_0_0ReactPageViewController.view addSubview:_ABI37_0_0ReactPageIndicatorView];
        [self addSubview:ABI37_0_0ReactPageViewController.view];
        _ABI37_0_0ReactPageViewController.view.frame = [self bounds];
        
        [_ABI37_0_0ReactPageViewController didMoveToParentViewController:[self ABI37_0_0ReactViewController]];
        [self shouldScroll:_scrollEnabled];
        
        // Add the page view controller's gesture recognizers to the view controller's view so that the gestures are started more easily.
        self.gestureRecognizers = _ABI37_0_0ReactPageViewController.gestureRecognizers;
        _ABI37_0_0ReactPageIndicatorView.translatesAutoresizingMaskIntoConstraints = NO;
        NSLayoutConstraint *bottomConstraint = [_ABI37_0_0ReactPageIndicatorView.bottomAnchor constraintEqualToAnchor: self.ABI37_0_0ReactPageViewController.view.bottomAnchor constant:0];
        NSLayoutConstraint *leadingConstraint = [_ABI37_0_0ReactPageIndicatorView.leadingAnchor constraintEqualToAnchor: self.ABI37_0_0ReactPageViewController.view.leadingAnchor constant:0];
        NSLayoutConstraint *trailingConstraint = [_ABI37_0_0ReactPageIndicatorView.trailingAnchor constraintEqualToAnchor: self.ABI37_0_0ReactPageViewController.view.trailingAnchor constant:0];
        [self.ABI37_0_0ReactPageViewController.view addConstraints:@[bottomConstraint,leadingConstraint,trailingConstraint]];
        [self.ABI37_0_0ReactPageViewController.view layoutIfNeeded];
    } else {
        ABI37_0_0RCTLog(@"getParentViewController returns nil");
    }
}

- (void)shouldScroll:(BOOL)scrollEnabled {
    _scrollEnabled = scrollEnabled;
    if (_ABI37_0_0ReactPageViewController.view) {
        for (UIScrollView *view in _ABI37_0_0ReactPageViewController.view.subviews) {
            if ([view isKindOfClass:[UIScrollView class]]) {
                view.scrollEnabled = scrollEnabled;
            }
        }
    }
}

- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard {
    _dismissKeyboard = [dismissKeyboard  isEqual: @"on-drag"] ?
    UIScrollViewKeyboardDismissModeOnDrag : UIScrollViewKeyboardDismissModeNone;
    for (UIView *subview in _ABI37_0_0ReactPageViewController.view.subviews) {
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
    
    for (UIView *view in [self ABI37_0_0ReactSubviews]) {
        [view removeFromSuperview];
        UIViewController *pageViewController = [self createChildViewController:view];
        if (index == _initialPage) {
            [self
             setABI37_0_0ReactViewControllers:index
             with:pageViewController
             direction:UIPageViewControllerNavigationDirectionForward
             animated:YES];
        }
        [_childrenViewControllers addObject:pageViewController];
        index++;
    }
}

- (void)setABI37_0_0ReactViewControllers:(NSInteger)index
                           with:(UIViewController *)pageViewController
                      direction:(UIPageViewControllerNavigationDirection)direction
                       animated:(BOOL)animated {
    __weak ABI37_0_0ReactNativePageView *weakSelf = self;
    uint16_t coalescingKey = _coalescingKey++;
    [_ABI37_0_0ReactPageViewController
     setViewControllers:[NSArray arrayWithObjects:pageViewController, nil]
     direction:direction
     animated:animated
     completion:^(BOOL finished) {
         weakSelf.currentIndex = index;
         if (weakSelf.eventDispatcher) {
             [weakSelf.eventDispatcher sendEvent:[[ABI37_0_0RCTOnPageSelected alloc] initWithABI37_0_0ReactTag:weakSelf.ABI37_0_0ReactTag position:[NSNumber numberWithInteger:index] coalescingKey:coalescingKey]];
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
        
        _ABI37_0_0ReactPageIndicatorView.currentPage = index.integerValue;
        UIPageViewControllerNavigationDirection direction =
        (index.integerValue > _currentIndex)
        ? UIPageViewControllerNavigationDirectionForward
        : UIPageViewControllerNavigationDirectionReverse;
        
        UIViewController *viewController =
        [_childrenViewControllers objectAtIndex:index.integerValue];
        [self setABI37_0_0ReactViewControllers:index.integerValue
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
        ABI37_0_0RCTLog(@"Only one screen support");
    }
}

- (void)pageViewController:(UIPageViewController *)pageViewController
        didFinishAnimating:(BOOL)finished
   previousViewControllers: (nonnull NSArray<UIViewController *> *)previousViewControllers
       transitionCompleted:(BOOL)completed {
    UIViewController* currentVC = pageViewController.viewControllers[0];
    _currentIndex = [_childrenViewControllers indexOfObject:currentVC];
    [_eventDispatcher sendEvent:[[ABI37_0_0RCTOnPageSelected alloc] initWithABI37_0_0ReactTag:self.ABI37_0_0ReactTag position:[NSNumber numberWithInteger:_currentIndex] coalescingKey:_coalescingKey++]];
    
    [_eventDispatcher sendEvent:[[ABI37_0_0RCTOnPageScrollEvent alloc] initWithABI37_0_0ReactTag:self.ABI37_0_0ReactTag position:[NSNumber numberWithInteger:_currentIndex] offset:[NSNumber numberWithFloat:0] coalescingKey:_coalescingKey++]];
    _ABI37_0_0ReactPageIndicatorView.currentPage = _currentIndex;
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
    if (_ABI37_0_0ReactPageIndicatorView){
        _ABI37_0_0ReactPageIndicatorView.hidden = !showPageIndicator;
    }
}

- (UIPageControl *)createPageIndicator:(UIView *)parentView {
    CGPoint parentOrigin = parentView.frame.origin;
    CGSize parentSize = parentView.frame.size;
    UIPageControl *pageControl = [[UIPageControl alloc] init];
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
    if (_ABI37_0_0ReactPageIndicatorView.currentPage != _currentIndex) {
        [self goTo:@(_ABI37_0_0ReactPageIndicatorView.currentPage) animated:YES];
    }
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView {
    [_eventDispatcher sendEvent:[[ABI37_0_0RCTOnPageScrollStateChanged alloc] initWithABI37_0_0ReactTag:self.ABI37_0_0ReactTag state:@"dragging" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView withVelocity:(CGPoint)velocity targetContentOffset:(inout CGPoint *)targetContentOffset {
    [_eventDispatcher sendEvent:[[ABI37_0_0RCTOnPageScrollStateChanged alloc] initWithABI37_0_0ReactTag:self.ABI37_0_0ReactTag state:@"settling" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
    [_eventDispatcher sendEvent:[[ABI37_0_0RCTOnPageScrollStateChanged alloc] initWithABI37_0_0ReactTag:self.ABI37_0_0ReactTag state:@"idle" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    CGPoint point = scrollView.contentOffset;
    float offset = (point.x - self.frame.size.width)/self.frame.size.width;
    if(fabs(offset) > 1) {
        offset = offset > 0 ? 1.0 : -1.0;
    }
    [_eventDispatcher sendEvent:[[ABI37_0_0RCTOnPageScrollEvent alloc] initWithABI37_0_0ReactTag:self.ABI37_0_0ReactTag position:[NSNumber numberWithInteger:_currentIndex] offset:[NSNumber numberWithFloat:offset] coalescingKey:_coalescingKey++]];
}

@end

