
#import "ReactNativePageView.h"
#import "React/RCTLog.h"
#import <React/RCTViewManager.h>

#import "UIViewController+CreateExtension.h"
#import "RCTOnPageScrollEvent.h"
#import "RCTOnPageScrollStateChanged.h"
#import "RCTOnPageSelected.h"
#import <math.h>

@interface ReactNativePageView () <UIPageViewControllerDataSource, UIPageViewControllerDelegate, UIScrollViewDelegate>

@property(nonatomic, strong) UIPageViewController *reactPageViewController;
@property(nonatomic, strong) UIPageControl *reactPageIndicatorView;
@property(nonatomic, strong) RCTEventDispatcher *eventDispatcher;

@property(nonatomic, weak) UIScrollView *scrollView;
@property(nonatomic, weak) UIView *currentView;

@property(nonatomic, strong) NSHashTable<UIViewController *> *cachedControllers;
@property (nonatomic, assign) CGPoint lastContentOffset;

- (void)goTo:(NSInteger)index animated:(BOOL)animated;
- (void)shouldScroll:(BOOL)scrollEnabled;
- (void)shouldShowPageIndicator:(BOOL)showPageIndicator;
- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard;


@end

@implementation ReactNativePageView {
    uint16_t _coalescingKey;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher {
    if (self = [super init]) {
        _scrollEnabled = YES;
        _pageMargin = 0;
        _lastReportedIndex = -1;
        _transitionStyle = UIPageViewControllerTransitionStyleScroll;
        _orientation = UIPageViewControllerNavigationOrientationHorizontal;
        _currentIndex = 0;
        _dismissKeyboard = UIScrollViewKeyboardDismissModeNone;
        _coalescingKey = 0;
        _eventDispatcher = eventDispatcher;
        _cachedControllers = [NSHashTable weakObjectsHashTable];
        _overdrag = NO;
        _layoutDirection = @"ltr";
        _previousBounds = CGRectMake(0, 0, 0, 0);
    }
    return self;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    if (self.reactPageViewController) {
        [self shouldScroll:self.scrollEnabled];

        if (!CGRectEqualToRect(self.previousBounds, CGRectMake(0, 0, 0, 0)) && !CGRectEqualToRect(self.bounds, self.previousBounds)) {
            // Below line fix bug, where the view does not update after orientation changed.
            [self updateDataSource];
        }

        self.previousBounds = CGRectMake(self.bounds.origin.x, self.bounds.origin.y, self.bounds.size.width, self.bounds.size.height);
    }
}

- (void)didUpdateReactSubviews {
    if (!self.reactPageViewController && self.reactViewController != nil) {
        [self embed];
        [self setupInitialController];
    } else {
        [self updateDataSource];
    }
}

- (void)didMoveToSuperview {
    [super didMoveToSuperview];
    if (!self.reactPageViewController && self.reactViewController != nil) {
        [self embed];
        [self setupInitialController];
    }
}

- (void)didMoveToWindow {
    [super didMoveToWindow];
    if (!self.reactPageViewController && self.reactViewController != nil) {
        [self embed];
        [self setupInitialController];
    }
}

- (void)embed {
    NSDictionary *options = @{ UIPageViewControllerOptionInterPageSpacingKey: @(self.pageMargin) };
    UIPageViewController *pageViewController = [[UIPageViewController alloc] initWithTransitionStyle:self.transitionStyle
                                                                               navigationOrientation:self.orientation
                                                                                             options:options];
    pageViewController.delegate = self;
    pageViewController.dataSource = self;
    
    for (UIView *subview in pageViewController.view.subviews) {
        if([subview isKindOfClass:UIScrollView.class]){
            ((UIScrollView *)subview).delegate = self;
            ((UIScrollView *)subview).keyboardDismissMode = _dismissKeyboard;
            ((UIScrollView *)subview).delaysContentTouches = NO;
            self.scrollView = (UIScrollView *)subview;
        }
    }
    
    self.reactPageViewController = pageViewController;
    
    UIPageControl *pageIndicatorView = [self createPageIndicator];
    
    pageIndicatorView.numberOfPages = self.reactSubviews.count;
    pageIndicatorView.currentPage = self.initialPage;
    pageIndicatorView.hidden = !self.showPageIndicator;
    
    self.reactPageIndicatorView = pageIndicatorView;
    
    [self reactAddControllerToClosestParent:pageViewController];
    [pageViewController.view addSubview:pageIndicatorView];
    [self addSubview:pageViewController.view];
    
    pageViewController.view.frame = self.bounds;
    
    [self shouldScroll:self.scrollEnabled];
    
    if (@available(iOS 9.0, *)) {
        pageIndicatorView.translatesAutoresizingMaskIntoConstraints = NO;
        NSLayoutConstraint *bottomConstraint = [pageIndicatorView.bottomAnchor constraintEqualToAnchor: pageViewController.view.bottomAnchor constant:0];
        NSLayoutConstraint *leadingConstraint = [pageIndicatorView.leadingAnchor constraintEqualToAnchor: pageViewController.view.leadingAnchor constant:0];
        NSLayoutConstraint *trailingConstraint = [pageIndicatorView.trailingAnchor constraintEqualToAnchor: pageViewController.view.trailingAnchor constant:0];
        
        [NSLayoutConstraint activateConstraints:@[bottomConstraint, leadingConstraint, trailingConstraint]];
    }
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
    UIView *initialView = self.reactSubviews[self.initialPage];
    if (initialView) {
        UIViewController *initialController = nil;
        if (initialView.reactViewController) {
            initialController = initialView.reactViewController;
        } else {
            initialController = [[UIViewController alloc] initWithView:initialView];
        }
        
        [self.cachedControllers addObject:initialController];
        
        [self setReactViewControllers:self.initialPage
                                 with:initialController
                            direction:UIPageViewControllerNavigationDirectionForward
                             animated:YES
             shouldCallOnPageSelected:YES];
    }
}

- (void)setReactViewControllers:(NSInteger)index
                           with:(UIViewController *)controller
                      direction:(UIPageViewControllerNavigationDirection)direction
                       animated:(BOOL)animated
                       shouldCallOnPageSelected:(BOOL)shouldCallOnPageSelected {
    if (self.reactPageViewController == nil) {
        return;
    }
    __weak ReactNativePageView *weakSelf = self;
    uint16_t coalescingKey = _coalescingKey++;
    
    [self.reactPageViewController setViewControllers:@[controller]
                                           direction:direction
                                            animated:animated
                                          completion:^(BOOL finished) {
        __strong typeof(self) strongSelf = weakSelf;
        strongSelf.currentIndex = index;
        strongSelf.currentView = controller.view;
        
        if (strongSelf.eventDispatcher) {
            if (strongSelf.lastReportedIndex != strongSelf.currentIndex) {
                if (shouldCallOnPageSelected) {
                    [strongSelf.eventDispatcher sendEvent:[[RCTOnPageSelected alloc] initWithReactTag:strongSelf.reactTag position:@(index) coalescingKey:coalescingKey]];
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
        if (controller.view.reactTag == view.reactTag) {
            return controller;
        }
    }
    return nil;
}

- (void)updateDataSource {
    if (!self.currentView && self.reactSubviews.count == 0) {
        return;
    }
    
    NSInteger newIndex = self.currentView ? [self.reactSubviews indexOfObject:self.currentView] : 0;
    
    if (newIndex == NSNotFound) {
        // Current view was removed
        NSInteger maxPage = self.reactSubviews.count - 1;
        NSInteger fallbackIndex = self.currentIndex >= maxPage ? maxPage : self.currentIndex;
        
        [self goTo:fallbackIndex animated:NO];
    } else {
        [self goTo:newIndex animated:NO];
    }
}

- (void)goTo:(NSInteger)index animated:(BOOL)animated {
    NSInteger numberOfPages = self.reactSubviews.count;
    
    if (numberOfPages == 0 || index < 0 || index > numberOfPages - 1) {
        return;
    }
    
    BOOL isForward = (index > self.currentIndex && [self isLtrLayout]) || (index < self.currentIndex && ![self isLtrLayout]);
    UIPageViewControllerNavigationDirection direction = isForward ? UIPageViewControllerNavigationDirectionForward : UIPageViewControllerNavigationDirectionReverse;
    
    self.reactPageIndicatorView.numberOfPages = numberOfPages;
    self.reactPageIndicatorView.currentPage = index;
    long diff = labs(index - _currentIndex);
    
    if (isForward && diff > 0) {
        for (NSInteger i=_currentIndex; i<=index; i++) {
            if (i == _currentIndex) {
                continue;
            }
            [self goToViewController:i direction:direction animated:animated shouldCallOnPageSelected: i == index];
        }
    }
    
    if (!isForward && diff > 0) {
        for (NSInteger i=_currentIndex; i>=index; i--) {
            // Prevent removal of one or many pages at a time
            if (index == _currentIndex || i >= numberOfPages) {
                continue;
            }
            [self goToViewController:i direction:direction animated:animated shouldCallOnPageSelected: i == index];
        }
    }
    
    if (diff == 0) {
        [self goToViewController:index direction:direction animated:animated shouldCallOnPageSelected:YES];
    }
}

- (void)goToViewController:(NSInteger)index
                            direction:(UIPageViewControllerNavigationDirection)direction
                            animated:(BOOL)animated
                            shouldCallOnPageSelected:(BOOL)shouldCallOnPageSelected {
    UIView *viewToDisplay = self.reactSubviews[index];
    UIViewController *controllerToDisplay = [self findAndCacheControllerForView:viewToDisplay];
    [self setReactViewControllers:index
                             with:controllerToDisplay
                        direction:direction
                         animated:animated
                        shouldCallOnPageSelected:shouldCallOnPageSelected];
}
    
- (UIViewController *)findAndCacheControllerForView:(UIView *)viewToDisplay {
    if (!viewToDisplay) { return nil; }
    
    UIViewController *controllerToDisplay = [self findCachedControllerForView:viewToDisplay];
    UIViewController *current = [self currentlyDisplayed];
    
    if (!controllerToDisplay && current.view.reactTag == viewToDisplay.reactTag) {
        controllerToDisplay = current;
    }
    if (!controllerToDisplay) {
        if (viewToDisplay.reactViewController) {
            controllerToDisplay = viewToDisplay.reactViewController;
        } else {
            controllerToDisplay = [[UIViewController alloc] initWithView:viewToDisplay];
        }
    }
    [self.cachedControllers addObject:controllerToDisplay];
    
    return controllerToDisplay;
}

- (UIViewController *)nextControllerForController:(UIViewController *)controller
                                      inDirection:(UIPageViewControllerNavigationDirection)direction {
    NSUInteger numberOfPages = self.reactSubviews.count;
    NSInteger index = [self.reactSubviews indexOfObject:controller.view];
    
    if (index == NSNotFound) {
        return nil;
    }
    
    direction == UIPageViewControllerNavigationDirectionForward ? index++ : index--;
    
    if (index < 0 || (index > (numberOfPages - 1))) {
        return nil;
    }
    
    UIView *viewToDisplay = self.reactSubviews[index];
    
    return [self findAndCacheControllerForView:viewToDisplay];
}

#pragma mark - UIPageViewControllerDelegate

- (void)pageViewController:(UIPageViewController *)pageViewController
        didFinishAnimating:(BOOL)finished
   previousViewControllers:(nonnull NSArray<UIViewController *> *)previousViewControllers
       transitionCompleted:(BOOL)completed {
    
    if (completed) {
        UIViewController* currentVC = [self currentlyDisplayed];
        NSUInteger currentIndex = [self.reactSubviews indexOfObject:currentVC.view];
        
        self.currentIndex = currentIndex;
        self.currentView = currentVC.view;
        self.reactPageIndicatorView.currentPage = currentIndex;
        [self.eventDispatcher sendEvent:[[RCTOnPageSelected alloc] initWithReactTag:self.reactTag position:@(currentIndex) coalescingKey:_coalescingKey++]];
        [self.eventDispatcher sendEvent:[[RCTOnPageScrollEvent alloc] initWithReactTag:self.reactTag position:@(currentIndex) offset:@(0.0)]];
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

- (void)shouldShowPageIndicator:(BOOL)showPageIndicator {
    _showPageIndicator = showPageIndicator;
    
    if (self.reactPageIndicatorView) {
        self.reactPageIndicatorView.hidden = !showPageIndicator;
    }
}

- (UIPageControl *)createPageIndicator {
    UIPageControl *pageControl = [[UIPageControl alloc] init];
    pageControl.tintColor = UIColor.blackColor;
    pageControl.pageIndicatorTintColor = UIColor.whiteColor;
    pageControl.currentPageIndicatorTintColor = UIColor.blackColor;
    [pageControl addTarget:self
                    action:@selector(pageControlValueChanged:)
          forControlEvents:UIControlEventValueChanged];
    
    return pageControl;
}

- (void)pageControlValueChanged:(UIPageControl *)sender {
    if (sender.currentPage != self.currentIndex) {
        [self goTo:sender.currentPage animated:YES];
    }
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView {
    [self.eventDispatcher sendEvent:[[RCTOnPageScrollStateChanged alloc] initWithReactTag:self.reactTag state:@"dragging" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView withVelocity:(CGPoint)velocity targetContentOffset:(inout CGPoint *)targetContentOffset {
    [self.eventDispatcher sendEvent:[[RCTOnPageScrollStateChanged alloc] initWithReactTag:self.reactTag state:@"settling" coalescingKey:_coalescingKey++]];
    
    if (!_overdrag) {
        NSInteger maxIndex = _reactPageIndicatorView.numberOfPages - 1;
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
    [self.eventDispatcher sendEvent:[[RCTOnPageScrollStateChanged alloc] initWithReactTag:self.reactTag state:@"idle" coalescingKey:_coalescingKey++]];
}

- (BOOL)isHorizontal {
    return self.orientation == UIPageViewControllerNavigationOrientationHorizontal;
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    CGPoint point = scrollView.contentOffset;
    
    float offset = 0;
    
    if (self.isHorizontal) {
        if (self.frame.size.width != 0) {
            offset = (point.x - self.frame.size.width)/self.frame.size.width;
        }
    } else {
        if (self.frame.size.height != 0) {
            offset = (point.y - self.frame.size.height)/self.frame.size.height;
        }
    }
    
    float absoluteOffset = fabs(offset);
    
    NSInteger position = self.currentIndex;
    
    
    BOOL isAnimatingBackwards = ([self isLtrLayout] && offset<0) || (![self isLtrLayout] && offset > 0.05f);
    if(isAnimatingBackwards){
        position =  self.currentIndex - 1;
        absoluteOffset =  fmax(0, 1 - absoluteOffset);
    }
    
    if (!_overdrag) {
        NSInteger maxIndex = _reactPageIndicatorView.numberOfPages - 1;
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
    
    self.lastContentOffset = scrollView.contentOffset;
    [self.eventDispatcher sendEvent:[[RCTOnPageScrollEvent alloc] initWithReactTag:self.reactTag position:@(position) offset:@(absoluteOffset)]];
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
