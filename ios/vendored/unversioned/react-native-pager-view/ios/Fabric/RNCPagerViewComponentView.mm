#ifdef RCT_NEW_ARCH_ENABLED

#import <Foundation/Foundation.h>
#import "RNCPagerViewComponentView.h"
#import <react/renderer/components/RNCViewPager/ComponentDescriptors.h>
#import <react/renderer/components/RNCViewPager/EventEmitters.h>
#import <react/renderer/components/RNCViewPager/Props.h>
#import <react/renderer/components/RNCViewPager/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "React/RCTConversions.h"

#import <React/RCTBridge+Private.h>
#import "RCTOnPageScrollEvent.h"

using namespace facebook::react;

@interface RNCPagerViewComponentView () <RCTRNCViewPagerViewProtocol, UIPageViewControllerDataSource, UIPageViewControllerDelegate, UIScrollViewDelegate, UIGestureRecognizerDelegate>

@property(nonatomic, assign) UIPanGestureRecognizer* panGestureRecognizer;

@end

@implementation RNCPagerViewComponentView {
    LayoutMetrics _layoutMetrics;
    UIScrollView *scrollView;
}

- (void)initializeNativePageViewController {
    const auto &viewProps = *std::static_pointer_cast<const RNCViewPagerProps>(_props);
    NSDictionary *options = @{ UIPageViewControllerOptionInterPageSpacingKey: @(viewProps.pageMargin) };
    UIPageViewControllerNavigationOrientation orientation = UIPageViewControllerNavigationOrientationHorizontal;
    switch (viewProps.orientation) {
        case RNCViewPagerOrientation::Horizontal:
            orientation = UIPageViewControllerNavigationOrientationHorizontal;
            break;
        case RNCViewPagerOrientation::Vertical:
            orientation = UIPageViewControllerNavigationOrientationVertical;
            break;
    }
    _nativePageViewController = [[UIPageViewController alloc]
                                 initWithTransitionStyle: UIPageViewControllerTransitionStyleScroll
                                 navigationOrientation:orientation
                                 options:options];
    _nativePageViewController.dataSource = self;
    _nativePageViewController.delegate = self;
    _nativePageViewController.view.frame = self.frame;
    self.contentView = _nativePageViewController.view;
    
    for (UIView *subview in _nativePageViewController.view.subviews) {
        if([subview isKindOfClass:UIScrollView.class]){
            ((UIScrollView *)subview).delegate = self;
            ((UIScrollView *)subview).delaysContentTouches = NO;
            scrollView = (UIScrollView *)subview;
        }
    }
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        static const auto defaultProps = std::make_shared<const RNCViewPagerProps>();
        _props = defaultProps;
        _nativeChildrenViewControllers = [[NSMutableArray alloc] init];
        _currentIndex = -1;
        _destinationIndex = -1;
        _layoutDirection = @"ltr";
        _overdrag = NO;
        UIPanGestureRecognizer* panGestureRecognizer = [UIPanGestureRecognizer new];
        self.panGestureRecognizer = panGestureRecognizer;
        panGestureRecognizer.delegate = self;
        [self addGestureRecognizer: panGestureRecognizer];

    }
    
    return self;
}

- (void)willMoveToSuperview:(UIView *)newSuperview {
    if (newSuperview != nil) {
        [self initializeNativePageViewController];
        [self goTo:_currentIndex animated:NO];
    }
}


#pragma mark - React API

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
    UIViewController *wrapper = [[UIViewController alloc] initWithView:childComponentView];
    [_nativeChildrenViewControllers insertObject:wrapper atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index {
    [[_nativeChildrenViewControllers objectAtIndex:index].view removeFromSuperview];
    [_nativeChildrenViewControllers objectAtIndex:index].view = nil;
    [_nativeChildrenViewControllers removeObjectAtIndex:index];
 
    NSInteger maxPage = _nativeChildrenViewControllers.count - 1;
    
    if (self.currentIndex >= maxPage) {
        [self goTo:maxPage animated:NO];
    }
}


-(void)updateLayoutMetrics:(const facebook::react::LayoutMetrics &)layoutMetrics oldLayoutMetrics:(const facebook::react::LayoutMetrics &)oldLayoutMetrics {
    [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:_layoutMetrics];
    self.contentView.frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
    _layoutMetrics = layoutMetrics;
}


-(void)prepareForRecycle {
    [super prepareForRecycle];
    
    _nativeChildrenViewControllers = [[NSMutableArray alloc] init];
    [_nativePageViewController.view removeFromSuperview];
    _nativePageViewController = nil;
    
    _currentIndex = -1;
}

- (void)shouldDismissKeyboard:(RNCViewPagerKeyboardDismissMode)dismissKeyboard {
    UIScrollViewKeyboardDismissMode dismissKeyboardMode = UIScrollViewKeyboardDismissModeNone;
    switch (dismissKeyboard) {
        case RNCViewPagerKeyboardDismissMode::None:
            dismissKeyboardMode = UIScrollViewKeyboardDismissModeNone;
            break;
        case RNCViewPagerKeyboardDismissMode::OnDrag:
            dismissKeyboardMode = UIScrollViewKeyboardDismissModeOnDrag;
            break;
    }
    scrollView.keyboardDismissMode = dismissKeyboardMode;
}


- (void)updateProps:(const facebook::react::Props::Shared &)props oldProps:(const facebook::react::Props::Shared &)oldProps{
    const auto &oldScreenProps = *std::static_pointer_cast<const RNCViewPagerProps>(_props);
    const auto &newScreenProps = *std::static_pointer_cast<const RNCViewPagerProps>(props);
    
    // change index only once
    if (_currentIndex == -1) {
        _currentIndex = newScreenProps.initialPage;
        [self shouldDismissKeyboard: newScreenProps.keyboardDismissMode];
    }
    
    const auto newLayoutDirectionStr = RCTNSStringFromString(toString(newScreenProps.layoutDirection));
    
    
    if (self.layoutDirection != newLayoutDirectionStr) {
        self.layoutDirection = newLayoutDirectionStr;
    }
    
    if (oldScreenProps.keyboardDismissMode != newScreenProps.keyboardDismissMode) {
        [self shouldDismissKeyboard: newScreenProps.keyboardDismissMode];
    }
    
    if (newScreenProps.scrollEnabled != scrollView.scrollEnabled) {
        scrollView.scrollEnabled = newScreenProps.scrollEnabled;
    }
    
    if (newScreenProps.overdrag != _overdrag) {
        _overdrag = newScreenProps.overdrag;
    }
    
    [super updateProps:props oldProps:oldProps];
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args {
    RCTRNCViewPagerHandleCommand(self, commandName, args);
}

#pragma mark - Internal methods

- (void)setPage:(NSInteger)index {
    [self goTo:index animated:YES];
}

- (void)setPageWithoutAnimation:(NSInteger)index {
    [self goTo:index animated:NO];
}

- (void)disableSwipe {
    self.nativePageViewController.view.userInteractionEnabled = NO;
}

- (void)enableSwipe {
    self.nativePageViewController.view.userInteractionEnabled = YES;
}

- (void)goTo:(NSInteger)index animated:(BOOL)animated {
    NSInteger numberOfPages = _nativeChildrenViewControllers.count;
    
    [self disableSwipe];
    
    _destinationIndex = index;
    
    
    if (numberOfPages == 0 || index < 0 || index > numberOfPages - 1) {
        return;
    }
    
    BOOL isForward = (index > self.currentIndex && [self isLtrLayout]) || (index < self.currentIndex && ![self isLtrLayout]);
    UIPageViewControllerNavigationDirection direction = isForward ? UIPageViewControllerNavigationDirectionForward : UIPageViewControllerNavigationDirectionReverse;
    
    long diff = labs(index - _currentIndex);
    
    [self setPagerViewControllers:index
                        direction:direction
                         animated:diff == 0 ? NO : animated];
    
}

- (void)setPagerViewControllers:(NSInteger)index
                      direction:(UIPageViewControllerNavigationDirection)direction
                       animated:(BOOL)animated{
    if (_nativePageViewController == nil) {
        [self enableSwipe];
        return;
    }
    
    __weak RNCPagerViewComponentView *weakSelf = self;
    [_nativePageViewController setViewControllers:@[[_nativeChildrenViewControllers objectAtIndex:index]]
                                        direction:direction
                                         animated:animated
                                       completion:^(BOOL finished) {
        __strong RNCPagerViewComponentView *strongSelf = weakSelf;
        [strongSelf enableSwipe];
        if (strongSelf->_eventEmitter != nullptr ) {
            const auto strongEventEmitter = *std::dynamic_pointer_cast<const RNCViewPagerEventEmitter>(strongSelf->_eventEmitter);
            int position = (int) index;
            strongEventEmitter.onPageSelected(RNCViewPagerEventEmitter::OnPageSelected{.position =  static_cast<double>(position)});
            strongSelf->_currentIndex = index;
        }
    }];
}


- (UIViewController *)nextControllerForController:(UIViewController *)controller
                                      inDirection:(UIPageViewControllerNavigationDirection)direction {
    NSUInteger numberOfPages = _nativeChildrenViewControllers.count;
    NSInteger index = [_nativeChildrenViewControllers indexOfObject:controller];
    
    if (index == NSNotFound) {
        return nil;
    }
    
    direction == UIPageViewControllerNavigationDirectionForward ? index++ : index--;
    
    if (index < 0 || (index > (numberOfPages - 1))) {
        return nil;
    }
    
    return [_nativeChildrenViewControllers objectAtIndex:index];
}

- (UIViewController *)currentlyDisplayed {
    return _nativePageViewController.viewControllers.firstObject;
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView {
    const auto strongEventEmitter = *std::dynamic_pointer_cast<const RNCViewPagerEventEmitter>(_eventEmitter);
    strongEventEmitter.onPageScrollStateChanged(RNCViewPagerEventEmitter::OnPageScrollStateChanged{.pageScrollState =  RNCViewPagerEventEmitter::OnPageScrollStateChangedPageScrollState::Dragging });
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView withVelocity:(CGPoint)velocity targetContentOffset:(inout CGPoint *)targetContentOffset {
    
    const auto strongEventEmitter = *std::dynamic_pointer_cast<const RNCViewPagerEventEmitter>(_eventEmitter);
    strongEventEmitter.onPageScrollStateChanged(RNCViewPagerEventEmitter::OnPageScrollStateChanged{.pageScrollState =  RNCViewPagerEventEmitter::OnPageScrollStateChangedPageScrollState::Settling });
    
    if (!_overdrag) {
        NSInteger maxIndex = _nativeChildrenViewControllers.count - 1;
        BOOL isFirstPage = [self isLtrLayout] ? _currentIndex == 0 : _currentIndex == maxIndex;
        BOOL isLastPage = [self isLtrLayout] ? _currentIndex == maxIndex : _currentIndex == 0;
        CGFloat contentOffset = [self isHorizontal] ? scrollView.contentOffset.x : scrollView.contentOffset.y;
        CGFloat topBound = [self isHorizontal] ? scrollView.bounds.size.width : scrollView.bounds.size.height;
        
        if ((isFirstPage && contentOffset <= topBound) || (isLastPage && contentOffset >= topBound)) {
            CGPoint croppedOffset = [self isHorizontal] ? CGPointMake(topBound, 0) : CGPointMake(0, topBound);
            *targetContentOffset = croppedOffset;
            
            strongEventEmitter.onPageScrollStateChanged(RNCViewPagerEventEmitter::OnPageScrollStateChanged{.pageScrollState =  RNCViewPagerEventEmitter::OnPageScrollStateChangedPageScrollState::Idle });
        }
    }
    
   
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
    const auto strongEventEmitter = *std::dynamic_pointer_cast<const RNCViewPagerEventEmitter>(_eventEmitter);
    strongEventEmitter.onPageScrollStateChanged(RNCViewPagerEventEmitter::OnPageScrollStateChanged{.pageScrollState =  RNCViewPagerEventEmitter::OnPageScrollStateChangedPageScrollState::Idle });
}

- (BOOL)isHorizontal {
    return _nativePageViewController.navigationOrientation == UIPageViewControllerNavigationOrientationHorizontal;
}

- (BOOL)isLtrLayout {
    return [_layoutDirection isEqualToString: @"ltr"];
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
    
    BOOL isAnimatingBackwards = offset<0;
    
    if (scrollView.isDragging) {
        _destinationIndex = isAnimatingBackwards ? _currentIndex - 1 : _currentIndex + 1;
    }
    
    if (isAnimatingBackwards) {
        position =  _destinationIndex;
        absoluteOffset =  fmax(0, 1 - absoluteOffset);
    }
    
    if (!_overdrag) {
        NSInteger maxIndex = _nativeChildrenViewControllers.count - 1;
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
    
    const auto strongEventEmitter = *std::dynamic_pointer_cast<const RNCViewPagerEventEmitter>(_eventEmitter);
    int eventPosition = (int) position;
    strongEventEmitter.onPageScroll(RNCViewPagerEventEmitter::OnPageScroll{.position =  static_cast<double>(eventPosition), .offset = interpolatedOffset});

    //This is temporary workaround to allow animations based on onPageScroll event
    //until Fabric implements proper NativeAnimationDriver
    RCTBridge *bridge = [RCTBridge currentBridge];
    
    if (bridge) {
        [bridge.eventDispatcher sendEvent:[[RCTOnPageScrollEvent alloc] initWithReactTag:[NSNumber numberWithInt:self.tag] position:@(position) offset:@(interpolatedOffset)]];
    }
    
}


#pragma mark - UIPageViewControllerDelegate

- (void)pageViewController:(UIPageViewController *)pageViewController
        didFinishAnimating:(BOOL)finished
   previousViewControllers:(nonnull NSArray<UIViewController *> *)previousViewControllers
       transitionCompleted:(BOOL)completed {
    if (completed) {
        UIViewController* currentVC = [self currentlyDisplayed];
        NSUInteger currentIndex = [_nativeChildrenViewControllers indexOfObject:currentVC];
        _currentIndex = currentIndex;
        int position = (int) currentIndex;
        const auto strongEventEmitter = *std::dynamic_pointer_cast<const RNCViewPagerEventEmitter>(_eventEmitter);
        strongEventEmitter.onPageSelected(RNCViewPagerEventEmitter::OnPageSelected{.position =  static_cast<double>(position)});
        strongEventEmitter.onPageScroll(RNCViewPagerEventEmitter::OnPageScroll{.position =  static_cast<double>(position), .offset =  0.0});
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

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<RNCViewPagerComponentDescriptor>();
}


- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer {

    // Recognize simultaneously only if the other gesture is RN Screen's pan gesture (one that is used to perform fullScreenGestureEnabled)
    if (gestureRecognizer == self.panGestureRecognizer && [NSStringFromClass([otherGestureRecognizer class]) isEqual: @"RNSPanGestureRecognizer"]) {
        UIPanGestureRecognizer* panGestureRecognizer = (UIPanGestureRecognizer*) gestureRecognizer;
        CGPoint velocity = [panGestureRecognizer velocityInView:self];
        BOOL isLTR = [self isLtrLayout];
        BOOL isBackGesture = (isLTR && velocity.x > 0) || (!isLTR && velocity.x < 0);
        
        if (self.currentIndex == 0 && isBackGesture) {
            scrollView.panGestureRecognizer.enabled = false;
        } else {
            const auto &viewProps = *std::static_pointer_cast<const RNCViewPagerProps>(_props);
            scrollView.panGestureRecognizer.enabled = viewProps.scrollEnabled;
        }
        
        return YES;
    }
    const auto &viewProps = *std::static_pointer_cast<const RNCViewPagerProps>(_props);
    scrollView.panGestureRecognizer.enabled = viewProps.scrollEnabled;
    return NO;
}

@end

Class<RCTComponentViewProtocol> RNCViewPagerCls(void)
{
    return RNCPagerViewComponentView.class;
}

#endif
