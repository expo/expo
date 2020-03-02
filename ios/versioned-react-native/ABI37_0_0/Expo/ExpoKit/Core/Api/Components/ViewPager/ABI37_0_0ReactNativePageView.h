
#import <ABI37_0_0React/ABI37_0_0RCTShadowView.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI37_0_0ReactNativePageView: UIView <UIPageViewControllerDataSource, UIPageViewControllerDelegate,UIScrollViewDelegate>

- (instancetype)initWithEventDispatcher:(ABI37_0_0RCTEventDispatcher *)eventDispatcher;

@property(strong, nonatomic, readonly) UIPageViewController *ABI37_0_0ReactPageViewController;
@property(strong, nonatomic, readonly) UIPageControl *ABI37_0_0ReactPageIndicatorView;
@property(nonatomic, readonly) ABI37_0_0RCTEventDispatcher *eventDispatcher;

@property(nonatomic, strong) NSMutableArray<UIViewController *> *childrenViewControllers;
@property(nonatomic) NSInteger initialPage;
@property(nonatomic) NSInteger currentIndex;
@property(nonatomic) NSInteger pageMargin;
@property(nonatomic, readonly) BOOL scrollEnabled;
@property(nonatomic, readonly) BOOL showPageIndicator;
@property(nonatomic, readonly) UIScrollViewKeyboardDismissMode dismissKeyboard;
@property(nonatomic) UIPageViewControllerTransitionStyle transitionStyle;
@property(nonatomic) UIPageViewControllerNavigationOrientation orientation;
@property(nonatomic, copy) ABI37_0_0RCTDirectEventBlock onPageSelected;
@property(nonatomic, copy) ABI37_0_0RCTDirectEventBlock onPageScroll;
@property(nonatomic, copy) ABI37_0_0RCTDirectEventBlock onPageScrollStateChanged;


- (void)goTo:(NSNumber *)index animated:(BOOL)animated;
- (void)shouldScroll:(BOOL)scrollEnabled;
- (void)shouldShowPageIndicator:(BOOL)showPageIndicator;
- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard;

@end

NS_ASSUME_NONNULL_END
