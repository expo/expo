
#import "ABI48_0_0ReactNativePageView.h"
#import "ABI48_0_0React/ABI48_0_0RCTLog.h"
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>

#import "UIViewController+CreateExtension.h"
#import "ABI48_0_0RCTOnPageScrollEvent.h"
#import "ABI48_0_0RCTOnPageScrollStateChanged.h"
#import "ABI48_0_0RCTOnPageSelected.h"
#import <math.h>

@interface ABI48_0_0ReactNativePageView () <UIPageViewControllerDataSource, UIPageViewControllerDelegate, UIScrollViewDelegate>

@property(nonatomic, strong) UIPageViewController *reactPageViewController;
@property(nonatomic, strong) ABI48_0_0RCTEventDispatcher *eventDispatcher;

@property(nonatomic, weak) UIScrollView *scrollView;
@property(nonatomic, weak) UIView *currentView;

@property(nonatomic, strong) NSHashTable<UIViewController *> *cachedControllers;
@property(nonatomic, assign) CGPoint lastContentOffset;

- (void)goTo:(NSInteger)index animated:(BOOL)animated;
- (void)shouldScroll:(BOOL)scrollEnabled;
- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard;


@end

@implementation ABI48_0_0ReactNativePageView {
    uint16_t _coalescingKey;
}

- (instancetype)initWithEventDispatcher:(ABI48_0_0RCTEventDispatcher *)eventDispatcher {
    if (self = [super init]) {
        _scrollEnabled = YES;
        _pageMargin = 0;
        _lastReportedIndex = -1;
        _destinationIndex = -1;
        _orientation = UIPageViewControllerNavigationOrientationHorizontal;
        _currentIndex = 0;
        _dismissKeyboard = UIScrollViewKeyboardDismissModeNone;
        _coalescingKey = 0;
        _eventDispatcher = eventDispatcher;
        _cachedControllers = [NSHashTable hashTableWithOptions:NSHashTableStrongMemory];
        _overdrag = NO;
        _layoutDirection = @"ltr";
    }
    return self;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    if (self.reactPageViewController) {
        [self shouldScroll:self.scrollEnabled];
    }
}

- (void)didUpdateABI48_0_0ReactSubviews {
    if (!self.reactPageViewController && self.ABI48_0_0ReactViewController != nil) {
        [self embed];
        [self setupInitialController];
    } else {
        [self updateDataSource];
    }
}

- (void)didMoveToSuperview {
    [super didMoveToSuperview];
    if (!self.reactPageViewController && self.ABI48_0_0ReactViewController != nil) {
        [self embed];
        [self setupInitialController];
    }
}

- (void)didMoveToWindow {
    [super didMoveToWindow];
    if (!self.reactPageViewController && self.ABI48_0_0ReactViewController != nil) {
        [self embed];
        [self setupInitialController];
    }

    if (self.ABI48_0_0ReactViewController.navigationController != nil && self.ABI48_0_0ReactViewController.navigationController.interactivePopGestureRecognizer != nil) {
        [self.scrollView.panGestureRecognizer requireGestureRecognizerToFail:self.ABI48_0_0ReactViewController.navigationController.interactivePopGestureRecognizer];
    }
}

- (void)embed {
    NSDictionary *options = @{ UIPageViewControllerOptionInterPageSpacingKey: @(self.pageMargin) };
    UIPageViewController *pageViewController = [[UIPageViewController alloc] initWithTransitionStyle:UIPageViewControllerTransitionStyleScroll
                                                                               navigationOrientation:self.orientation
                                                                                             options:options];
    pageViewController.delegate = self;
    pageViewController.dataSource = self;
    
    for (UIView *subview in pageViewController.view.subviews) {
        if([subview isKindOfClass:UIScrollView.class]){
            ((UIScrollView *)subview).delegate = self;
            ((UIScrollView *)subview).keyboardDismissMode = _dismissKeyboard;
            ((UIScrollView *)subview).delaysContentTouches = YES;
            self.scrollView = (UIScrollView *)subview;
        }
    }
    
    self.reactPageViewController = pageViewController;
    
    [self ABI48_0_0ReactAddControllerToClosestParent:pageViewController];
    [self addSubview:pageViewController.view];
    
    pageViewController.view.frame = self.bounds;
    
    [self shouldScroll:self.scrollEnabled];
    
    [pageViewController.view layoutIfNeeded];
}

- (void)shouldScroll:(BOOL)scrollEnabled {
    _scrollEnabled = scrollEnabled;
    if (self.reactPageViewController.view) {
        self.scrollView.scrollEnabled = scrollEnabled;
    }
}

- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard {
    _dismissKeyboard = [dismissKeyboard  isEqual: @"on-drag"] ?
    UIScrollViewKeyboardDismissModeOnDrag : UIScrollViewKeyboardDismissModeNone;
    self.scrollView.keyboardDismissMode = _dismissKeyboard;
}

- (void)setupInitialController {
    UIView *initialView = self.ABI48_0_0ReactSubviews[self.initialPage];
    if (initialView) {
        UIViewController *initialController = nil;
        if (initialView.ABI48_0_0ReactViewController) {
            initialController = initialView.ABI48_0_0ReactViewController;
        } else {
            initialController = [[UIViewController alloc] initWithView:initialView];
        }
        
        [self.cachedControllers addObject:initialController];
        
        [self setABI48_0_0ReactViewControllers:self.initialPage
                                 with:initialController
                            direction:UIPageViewControllerNavigationDirectionForward
                             animated:YES
             shouldCallOnPageSelected:YES];
    }
}

- (void)setABI48_0_0ReactViewControllers:(NSInteger)index
                           with:(UIViewController *)controller
                      direction:(UIPageViewControllerNavigationDirection)direction
                       animated:(BOOL)animated
                       shouldCallOnPageSelected:(BOOL)shouldCallOnPageSelected {
    if (self.reactPageViewController == nil) {
        [self enableSwipe];
        return;
    }

    NSArray *currentVCs = self.reactPageViewController.viewControllers;
    if (currentVCs.count == 1 && [currentVCs.firstObject isEqual:controller]) {
        [self enableSwipe];
        return;
    }

    __weak ABI48_0_0ReactNativePageView *weakSelf = self;
    uint16_t coalescingKey = _coalescingKey++;
    
    if (animated == YES) {
        self.animating = YES;
    }
    
    [self.reactPageViewController setViewControllers:@[controller]
                                           direction:direction
                                            animated:animated
                                          completion:^(BOOL finished) {
        __strong typeof(self) strongSelf = weakSelf;
        strongSelf.currentIndex = index;
        strongSelf.currentView = controller.view;
        
        [strongSelf enableSwipe];
        
        if (finished) {
            strongSelf.animating = NO;
        }
        
        if (strongSelf.eventDispatcher) {
            if (strongSelf.lastReportedIndex != strongSelf.currentIndex) {
                if (shouldCallOnPageSelected) {
                    [strongSelf.eventDispatcher sendEvent:[[ABI48_0_0RCTOnPageSelected alloc] initWithABI48_0_0ReactTag:strongSelf.ABI48_0_0ReactTag position:@(index) coalescingKey:coalescingKey]];
                }
                strongSelf.lastReportedIndex = strongSelf.currentIndex;
            }
        }
    }];
}

- (UIViewController *)currentlyDisplayed {
    return self.reactPageViewController.viewControllers.firstObject;
}

- (UIViewController *)findCachedControllerForView:(UIView *)view {
    for (UIViewController *controller in self.cachedControllers) {
        if (controller.view.ABI48_0_0ReactTag == view.ABI48_0_0ReactTag) {
            return controller;
        }
    }
    return nil;
}

- (void)updateDataSource {
    if (!self.currentView && self.ABI48_0_0ReactSubviews.count == 0) {
        return;
    }
    
    NSInteger newIndex = self.currentView ? [self.ABI48_0_0ReactSubviews indexOfObject:self.currentView] : 0;
    
    if (newIndex == NSNotFound) {
        //Current view was removed
        NSInteger maxPage = self.ABI48_0_0ReactSubviews.count - 1;
        NSInteger fallbackIndex = self.currentIndex >= maxPage ? maxPage : self.currentIndex;
        
        [self goTo:fallbackIndex animated:NO];
    } else {
        [self goTo:newIndex animated:NO];
    }
}

- (void)disableSwipe {
    self.reactPageViewController.view.userInteractionEnabled = NO;
}

- (void)enableSwipe {
    self.reactPageViewController.view.userInteractionEnabled = YES;
}

- (void)goTo:(NSInteger)index animated:(BOOL)animated {
    NSInteger numberOfPages = self.ABI48_0_0ReactSubviews.count;
    
    [self disableSwipe];
    
    _destinationIndex = index;
    
    if (numberOfPages == 0 || index < 0 || index > numberOfPages - 1) {
        return;
    }
    
    BOOL isRTL = ![self isLtrLayout];
    
    BOOL isForward = (index > self.currentIndex && !isRTL) || (index < self.currentIndex && isRTL);

    
    UIPageViewControllerNavigationDirection direction = isForward ? UIPageViewControllerNavigationDirectionForward : UIPageViewControllerNavigationDirectionReverse;
    
    long diff = labs(index - _currentIndex);
    
    [self goToViewController:index direction:direction animated:(!self.animating && animated) shouldCallOnPageSelected: YES];
    
    if (diff == 0) {
        [self goToViewController:index direction:direction animated:NO shouldCallOnPageSelected:YES];
    }
}

- (void)goToViewController:(NSInteger)index
                            direction:(UIPageViewControllerNavigationDirection)direction
                            animated:(BOOL)animated
                            shouldCallOnPageSelected:(BOOL)shouldCallOnPageSelected {
    UIView *viewToDisplay = self.ABI48_0_0ReactSubviews[index];
    UIViewController *controllerToDisplay = [self findAndCacheControllerForView:viewToDisplay];
    [self setABI48_0_0ReactViewControllers:index
                             with:controllerToDisplay
                        direction:direction
                         animated:animated
                        shouldCallOnPageSelected:shouldCallOnPageSelected];
}
    
- (UIViewController *)findAndCacheControllerForView:(UIView *)viewToDisplay {
    if (!viewToDisplay) { return nil; }
    
    UIViewController *controllerToDisplay = [self findCachedControllerForView:viewToDisplay];
    UIViewController *current = [self currentlyDisplayed];
    
    if (!controllerToDisplay && current.view.ABI48_0_0ReactTag == viewToDisplay.ABI48_0_0ReactTag) {
        controllerToDisplay = current;
    }
    if (!controllerToDisplay) {
        if (viewToDisplay.ABI48_0_0ReactViewController) {
            controllerToDisplay = viewToDisplay.ABI48_0_0ReactViewController;
        } else {
            controllerToDisplay = [[UIViewController alloc] initWithView:viewToDisplay];
        }
    }
    [self.cachedControllers addObject:controllerToDisplay];
    
    return controllerToDisplay;
}

- (UIViewController *)nextControllerForController:(UIViewController *)controller
                                      inDirection:(UIPageViewControllerNavigationDirection)direction {
    NSUInteger numberOfPages = self.ABI48_0_0ReactSubviews.count;
    NSInteger index = [self.ABI48_0_0ReactSubviews indexOfObject:controller.view];
    
    if (index == NSNotFound) {
        return nil;
    }
    
    direction == UIPageViewControllerNavigationDirectionForward ? index++ : index--;
    
    if (index < 0 || (index > (numberOfPages - 1))) {
        return nil;
    }
    
    UIView *viewToDisplay = self.ABI48_0_0ReactSubviews[index];
    
    return [self findAndCacheControllerForView:viewToDisplay];
}

#pragma mark - UIPageViewControllerDelegate

- (void)pageViewController:(UIPageViewController *)pageViewController
        didFinishAnimating:(BOOL)finished
   previousViewControllers:(nonnull NSArray<UIViewController *> *)previousViewControllers
       transitionCompleted:(BOOL)completed {
    
    if (completed) {
        UIViewController* currentVC = [self currentlyDisplayed];
        NSUInteger currentIndex = [self.ABI48_0_0ReactSubviews indexOfObject:currentVC.view];
        
        self.currentIndex = currentIndex;
        self.currentView = currentVC.view;
        [self.eventDispatcher sendEvent:[[ABI48_0_0RCTOnPageSelected alloc] initWithABI48_0_0ReactTag:self.ABI48_0_0ReactTag position:@(currentIndex) coalescingKey:_coalescingKey++]];
        [self.eventDispatcher sendEvent:[[ABI48_0_0RCTOnPageScrollEvent alloc] initWithABI48_0_0ReactTag:self.ABI48_0_0ReactTag position:@(currentIndex) offset:@(0.0)]];
        self.lastReportedIndex = currentIndex;
    }
}

#pragma mark - UIPageViewControllerDataSource

- (UIViewController *)pageViewController:(UIPageViewController *)pageViewController
       viewControllerAfterViewController:(UIViewController *)viewController {
    UIPageViewControllerNavigationDirection direction = [self isLtrLayout] ? UIPageViewControllerNavigationDirectionForward : UIPageViewControllerNavigationDirectionReverse;
    return [self nextControllerForController:viewController inDirection:direction];
}

- (UIViewController *)pageViewController:(UIPageViewController *)pageViewController
      viewControllerBeforeViewController:(UIViewController *)viewController {
    UIPageViewControllerNavigationDirection direction = [self isLtrLayout] ? UIPageViewControllerNavigationDirectionReverse : UIPageViewControllerNavigationDirectionForward;
    return [self nextControllerForController:viewController inDirection:direction];
}

#pragma mark - UIPageControlDelegate

- (void)pageControlValueChanged:(UIPageControl *)sender {
    if (sender.currentPage != self.currentIndex) {
        [self goTo:sender.currentPage animated:YES];
    }
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView {
    [self.eventDispatcher sendEvent:[[ABI48_0_0RCTOnPageScrollStateChanged alloc] initWithABI48_0_0ReactTag:self.ABI48_0_0ReactTag state:@"dragging" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView withVelocity:(CGPoint)velocity targetContentOffset:(inout CGPoint *)targetContentOffset {
    [self.eventDispatcher sendEvent:[[ABI48_0_0RCTOnPageScrollStateChanged alloc] initWithABI48_0_0ReactTag:self.ABI48_0_0ReactTag state:@"settling" coalescingKey:_coalescingKey++]];
    
    if (!_overdrag) {
        NSInteger maxIndex = self.ABI48_0_0ReactSubviews.count - 1;
        BOOL isFirstPage = [self isLtrLayout] ? _currentIndex == 0 : _currentIndex == maxIndex;
        BOOL isLastPage = [self isLtrLayout] ? _currentIndex == maxIndex : _currentIndex == 0;
        CGFloat contentOffset =[self isHorizontal] ? scrollView.contentOffset.x : scrollView.contentOffset.y;
        CGFloat topBound = [self isHorizontal] ? scrollView.bounds.size.width : scrollView.bounds.size.height;
        
        if ((isFirstPage && contentOffset <= topBound) || (isLastPage && contentOffset >= topBound)) {
            CGPoint croppedOffset = [self isHorizontal] ? CGPointMake(topBound, 0) : CGPointMake(0, topBound);
            *targetContentOffset = croppedOffset;
        }
    }
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
    [self.eventDispatcher sendEvent:[[ABI48_0_0RCTOnPageScrollStateChanged alloc] initWithABI48_0_0ReactTag:self.ABI48_0_0ReactTag state:@"idle" coalescingKey:_coalescingKey++]];
}

- (BOOL)isHorizontal {
    return self.orientation == UIPageViewControllerNavigationOrientationHorizontal;
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    CGPoint point = scrollView.contentOffset;
    
    float offset = 0;
    
    if (self.isHorizontal) {
        if (scrollView.frame.size.width != 0) {
            offset = (point.x - scrollView.frame.size.width)/scrollView.frame.size.width;
        }
    } else {
        if (scrollView.frame.size.height != 0) {
            offset = (point.y - scrollView.frame.size.height)/scrollView.frame.size.height;
        }
    }
    
    float absoluteOffset = fabs(offset);
    
    NSInteger position = self.currentIndex;
    
    BOOL isAnimatingBackwards = ([self isLtrLayout] && offset<0) || (![self isLtrLayout] && offset > 0.05f);
    
    if (scrollView.isDragging) {
        _destinationIndex = isAnimatingBackwards ? _currentIndex - 1 : _currentIndex + 1;
    }
    
    if(isAnimatingBackwards){
        position = _destinationIndex;
        absoluteOffset = fmax(0, 1 - absoluteOffset);
    }
    
    if (!_overdrag) {
        NSInteger maxIndex = self.ABI48_0_0ReactSubviews.count - 1;
        NSInteger firstPageIndex = [self isLtrLayout] ?  0 :  maxIndex;
        NSInteger lastPageIndex = [self isLtrLayout] ?  maxIndex :  0;
        BOOL isFirstPage = _currentIndex == firstPageIndex;
        BOOL isLastPage = _currentIndex == lastPageIndex;
        CGFloat contentOffset =[self isHorizontal] ? scrollView.contentOffset.x : scrollView.contentOffset.y;
        CGFloat topBound = [self isHorizontal] ? scrollView.bounds.size.width : scrollView.bounds.size.height;
        
        if ((isFirstPage && contentOffset <= topBound) || (isLastPage && contentOffset >= topBound)) {
            CGPoint croppedOffset = [self isHorizontal] ? CGPointMake(topBound, 0) : CGPointMake(0, topBound);
            scrollView.contentOffset = croppedOffset;
            absoluteOffset=0;
            position = isLastPage ? lastPageIndex : firstPageIndex;
        }
    }

    float interpolatedOffset = absoluteOffset * labs(_destinationIndex - _currentIndex);
    
    self.lastContentOffset = scrollView.contentOffset;
    [self.eventDispatcher sendEvent:[[ABI48_0_0RCTOnPageScrollEvent alloc] initWithABI48_0_0ReactTag:self.ABI48_0_0ReactTag position:@(position) offset:@(interpolatedOffset)]];
}

- (NSString *)determineScrollDirection:(UIScrollView *)scrollView {
    NSString *scrollDirection;
    if (self.isHorizontal) {
        if (self.lastContentOffset.x > scrollView.contentOffset.x) {
            scrollDirection = @"left";
        } else if (self.lastContentOffset.x < scrollView.contentOffset.x) {
            scrollDirection = @"right";
        }
    } else {
        if (self.lastContentOffset.y > scrollView.contentOffset.y) {
            scrollDirection = @"up";
        } else if (self.lastContentOffset.y < scrollView.contentOffset.y) {
            scrollDirection = @"down";
        }
    }
    return scrollDirection;
}

- (BOOL)isLtrLayout {
    return [_layoutDirection isEqualToString:@"ltr"];
}
@end
