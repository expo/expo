
#import "ABI42_0_0ReactNativePageView.h"
#import "ABI42_0_0React/ABI42_0_0RCTLog.h"
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>

#import "ABI42_0_0UIViewController+CreateExtension.h"
#import "ABI42_0_0RCTOnPageScrollEvent.h"
#import "ABI42_0_0RCTOnPageScrollStateChanged.h"
#import "ABI42_0_0RCTOnPageSelected.h"

@interface ABI42_0_0ReactNativePageView () <UIPageViewControllerDataSource, UIPageViewControllerDelegate, UIScrollViewDelegate>

@property(nonatomic, strong) UIPageViewController *ABI42_0_0ReactPageViewController;
@property(nonatomic, strong) UIPageControl *ABI42_0_0ReactPageIndicatorView;
@property(nonatomic, strong) ABI42_0_0RCTEventDispatcher *eventDispatcher;

@property(nonatomic, weak) UIScrollView *scrollView;
@property(nonatomic, weak) UIView *currentView;

@property(nonatomic, strong) NSHashTable<UIViewController *> *cachedControllers;
@property (nonatomic, assign) CGPoint lastContentOffset;

- (void)goTo:(NSInteger)index animated:(BOOL)animated;
- (void)shouldScroll:(BOOL)scrollEnabled;
- (void)shouldShowPageIndicator:(BOOL)showPageIndicator;
- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard;


@end

@implementation ABI42_0_0ReactNativePageView {
    uint16_t _coalescingKey;
}

- (instancetype)initWithEventDispatcher:(ABI42_0_0RCTEventDispatcher *)eventDispatcher {
    if (self = [super init]) {
        _scrollEnabled = YES;
        _pageMargin = 0;
        _transitionStyle = UIPageViewControllerTransitionStyleScroll;
        _orientation = UIPageViewControllerNavigationOrientationHorizontal;
        _currentIndex = 0;
        _dismissKeyboard = UIScrollViewKeyboardDismissModeNone;
        _coalescingKey = 0;
        _eventDispatcher = eventDispatcher;
        _cachedControllers = [NSHashTable weakObjectsHashTable];
        _overdrag = YES;
    }
    return self;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    if (self.ABI42_0_0ReactPageViewController) {
        [self shouldScroll:self.scrollEnabled];
        //Below line fix bug, where the view does not update after orientation changed.
        [self updateDataSource];
    }
}

- (void)didUpdateABI42_0_0ReactSubviews {
    if (!self.ABI42_0_0ReactPageViewController && self.ABI42_0_0ReactViewController != nil) {
        [self embed];
        [self setupInitialController];
    } else {
        [self updateDataSource];
    }
}

- (void)didMoveToSuperview {
    [super didMoveToSuperview];
    if (!self.ABI42_0_0ReactPageViewController && self.ABI42_0_0ReactViewController != nil) {
        [self embed];
        [self setupInitialController];
    }
}

- (void)didMoveToWindow {
    [super didMoveToWindow];
    if (!self.ABI42_0_0ReactPageViewController && self.ABI42_0_0ReactViewController != nil) {
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
    
    self.ABI42_0_0ReactPageViewController = pageViewController;
    
    UIPageControl *pageIndicatorView = [self createPageIndicator];
    
    pageIndicatorView.numberOfPages = self.ABI42_0_0ReactSubviews.count;
    pageIndicatorView.currentPage = self.initialPage;
    pageIndicatorView.hidden = !self.showPageIndicator;
    
    self.ABI42_0_0ReactPageIndicatorView = pageIndicatorView;
    
    [self ABI42_0_0ReactAddControllerToClosestParent:pageViewController];
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
    if (self.ABI42_0_0ReactPageViewController.view) {
        self.scrollView.scrollEnabled = scrollEnabled;
    }
}

- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard {
    _dismissKeyboard = [dismissKeyboard  isEqual: @"on-drag"] ?
    UIScrollViewKeyboardDismissModeOnDrag : UIScrollViewKeyboardDismissModeNone;
    self.scrollView.keyboardDismissMode = _dismissKeyboard;
}

- (void)setupInitialController {
    UIView *initialView = self.ABI42_0_0ReactSubviews[self.initialPage];
    if (initialView) {
        UIViewController *initialController = [[UIViewController alloc] initWithView:initialView];
        [self.cachedControllers addObject:initialController];
        
        [self setABI42_0_0ReactViewControllers:self.initialPage
                                 with:initialController
                            direction:UIPageViewControllerNavigationDirectionForward
                             animated:YES];
    }
}

- (void)setABI42_0_0ReactViewControllers:(NSInteger)index
                           with:(UIViewController *)controller
                      direction:(UIPageViewControllerNavigationDirection)direction
                       animated:(BOOL)animated {
    if (self.ABI42_0_0ReactPageViewController == nil) {
        return;
    }
    __weak ABI42_0_0ReactNativePageView *weakSelf = self;
    uint16_t coalescingKey = _coalescingKey++;
    
    [self.ABI42_0_0ReactPageViewController setViewControllers:@[controller]
                                           direction:direction
                                            animated:animated
                                          completion:^(BOOL finished) {
        
        weakSelf.currentIndex = index;
        weakSelf.currentView = controller.view;
        
        if (weakSelf.eventDispatcher) {
            [weakSelf.eventDispatcher sendEvent:[[ABI42_0_0RCTOnPageSelected alloc] initWithABI42_0_0ReactTag:weakSelf.ABI42_0_0ReactTag position:@(index) coalescingKey:coalescingKey]];
        }
        
    }];
}

- (UIViewController *)currentlyDisplayed {
    return self.ABI42_0_0ReactPageViewController.viewControllers.firstObject;
}

- (UIViewController *)findCachedControllerForView:(UIView *)view {
    for (UIViewController *controller in self.cachedControllers) {
        if (controller.view.ABI42_0_0ReactTag == view.ABI42_0_0ReactTag) {
            return controller;
        }
    }
    return nil;
}

- (void)updateDataSource {
    if (!self.currentView) {
        return;
    }
    
    NSInteger newIndex = [self.ABI42_0_0ReactSubviews indexOfObject:self.currentView];
    
    if (newIndex == NSNotFound) {
        // Current view was removed
        [self goTo:self.currentIndex animated:NO];
    } else {
        [self goTo:newIndex animated:NO];
    }
}

- (void)goTo:(NSInteger)index animated:(BOOL)animated {
    NSInteger numberOfPages = self.ABI42_0_0ReactSubviews.count;
    
    if (numberOfPages == 0 || index < 0) {
        return;
    }
    
    UIPageViewControllerNavigationDirection direction = (index > self.currentIndex) ? UIPageViewControllerNavigationDirectionForward : UIPageViewControllerNavigationDirectionReverse;
    
    NSInteger indexToDisplay = index < numberOfPages ? index : numberOfPages - 1;
    
    UIView *viewToDisplay = self.ABI42_0_0ReactSubviews[indexToDisplay];
    UIViewController *controllerToDisplay = [self findAndCacheControllerForView:viewToDisplay];
    
    self.ABI42_0_0ReactPageIndicatorView.numberOfPages = numberOfPages;
    self.ABI42_0_0ReactPageIndicatorView.currentPage = indexToDisplay;
    
    [self setABI42_0_0ReactViewControllers:indexToDisplay
                             with:controllerToDisplay
                        direction:direction
                         animated:animated];
    
}

- (UIViewController *)findAndCacheControllerForView:(UIView *)viewToDisplay {
    if (!viewToDisplay) { return nil; }
    
    UIViewController *controllerToDisplay = [self findCachedControllerForView:viewToDisplay];
    UIViewController *current = [self currentlyDisplayed];
    
    if (!controllerToDisplay && current.view.ABI42_0_0ReactTag == viewToDisplay.ABI42_0_0ReactTag) {
        controllerToDisplay = current;
    }
    if (!controllerToDisplay) {
        controllerToDisplay = [[UIViewController alloc] initWithView:viewToDisplay];
    }
    [self.cachedControllers addObject:controllerToDisplay];
    
    return controllerToDisplay;
}

- (UIViewController *)nextControllerForController:(UIViewController *)controller
                                      inDirection:(UIPageViewControllerNavigationDirection)direction {
    NSUInteger numberOfPages = self.ABI42_0_0ReactSubviews.count;
    NSInteger index = [self.ABI42_0_0ReactSubviews indexOfObject:controller.view];
    
    if (index == NSNotFound) {
        return nil;
    }
    
    direction == UIPageViewControllerNavigationDirectionForward ? index++ : index--;
    
    if (index < 0 || (index > (numberOfPages - 1))) {
        return nil;
    }
    
    UIView *viewToDisplay = self.ABI42_0_0ReactSubviews[index];
    
    return [self findAndCacheControllerForView:viewToDisplay];
}

#pragma mark - UIPageViewControllerDelegate

- (void)pageViewController:(UIPageViewController *)pageViewController
        didFinishAnimating:(BOOL)finished
   previousViewControllers:(nonnull NSArray<UIViewController *> *)previousViewControllers
       transitionCompleted:(BOOL)completed {
    
    if (completed) {
        UIViewController* currentVC = [self currentlyDisplayed];
        NSUInteger currentIndex = [self.ABI42_0_0ReactSubviews indexOfObject:currentVC.view];
        
        self.currentIndex = currentIndex;
        
        self.currentView = currentVC.view;
        self.ABI42_0_0ReactPageIndicatorView.currentPage = currentIndex;
        
        [self.eventDispatcher sendEvent:[[ABI42_0_0RCTOnPageSelected alloc] initWithABI42_0_0ReactTag:self.ABI42_0_0ReactTag position:@(currentIndex) coalescingKey:_coalescingKey++]];
        [self.eventDispatcher sendEvent:[[ABI42_0_0RCTOnPageScrollEvent alloc] initWithABI42_0_0ReactTag:self.ABI42_0_0ReactTag position:@(currentIndex) offset:@(0.0)]];
    }
}

#pragma mark - UIPageViewControllerDataSource

- (UIViewController *)pageViewController:(UIPageViewController *)pageViewController
       viewControllerAfterViewController:(UIViewController *)viewController {
    return [self nextControllerForController:viewController inDirection:UIPageViewControllerNavigationDirectionForward];
}

- (UIViewController *)pageViewController:(UIPageViewController *)pageViewController
      viewControllerBeforeViewController:(UIViewController *)viewController {
    return [self nextControllerForController:viewController inDirection:UIPageViewControllerNavigationDirectionReverse];
}

#pragma mark - UIPageControlDelegate

- (void)shouldShowPageIndicator:(BOOL)showPageIndicator {
    _showPageIndicator = showPageIndicator;
    
    if (self.ABI42_0_0ReactPageIndicatorView) {
        self.ABI42_0_0ReactPageIndicatorView.hidden = !showPageIndicator;
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
    [self.eventDispatcher sendEvent:[[ABI42_0_0RCTOnPageScrollStateChanged alloc] initWithABI42_0_0ReactTag:self.ABI42_0_0ReactTag state:@"dragging" coalescingKey:_coalescingKey++]];
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView withVelocity:(CGPoint)velocity targetContentOffset:(inout CGPoint *)targetContentOffset {
    [self.eventDispatcher sendEvent:[[ABI42_0_0RCTOnPageScrollStateChanged alloc] initWithABI42_0_0ReactTag:self.ABI42_0_0ReactTag state:@"settling" coalescingKey:_coalescingKey++]];
    
    if (!_overdrag) {
        if (_currentIndex == 0 && scrollView.contentOffset.x <= scrollView.bounds.size.width) {
            *targetContentOffset = CGPointMake(scrollView.bounds.size.width, 0);
        } else if (_currentIndex == _ABI42_0_0ReactPageIndicatorView.numberOfPages -1 && scrollView.contentOffset.x >= scrollView.bounds.size.width) {
            *targetContentOffset = CGPointMake(scrollView.bounds.size.width, 0);
        }
    }
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
    [self.eventDispatcher sendEvent:[[ABI42_0_0RCTOnPageScrollStateChanged alloc] initWithABI42_0_0ReactTag:self.ABI42_0_0ReactTag state:@"idle" coalescingKey:_coalescingKey++]];
}

- (BOOL)isHorizontal {
    return self.orientation == UIPageViewControllerNavigationOrientationHorizontal;
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    CGPoint point = scrollView.contentOffset;

    float offset = 0;
    
    if (!_overdrag) {
        if (_currentIndex == 0 && scrollView.contentOffset.x < scrollView.bounds.size.width) {
            scrollView.contentOffset = CGPointMake(scrollView.bounds.size.width, 0);
        } else if (_currentIndex == _ABI42_0_0ReactPageIndicatorView.numberOfPages - 1 && scrollView.contentOffset.x > scrollView.bounds.size.width) {
            scrollView.contentOffset = CGPointMake(scrollView.bounds.size.width, 0);
        }
    }
    
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
    if(absoluteOffset > 1) {
        absoluteOffset = 1.0;
    }
    
    NSString *scrollDirection = [self determineScrollDirection:scrollView];
    NSString *oppositeDirection = self.isHorizontal ? @"left" : @"up";
    NSInteger position = self.currentIndex;

    if(absoluteOffset > 0) {
        position = [scrollDirection  isEqual: oppositeDirection] ? self.currentIndex - 1 : self.currentIndex;
        absoluteOffset =  [scrollDirection  isEqual: oppositeDirection] ? 1 - absoluteOffset : absoluteOffset;
    }
   
    
    self.lastContentOffset = scrollView.contentOffset;
    [self.eventDispatcher sendEvent:[[ABI42_0_0RCTOnPageScrollEvent alloc] initWithABI42_0_0ReactTag:self.ABI42_0_0ReactTag position:@(position) offset:@(absoluteOffset)]];
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
@end
