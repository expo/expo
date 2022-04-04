#import <React/RCTEventDispatcher.h>
#import <React/RCTShadowView.h>
#import <React/UIView+React.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface ReactNativePageView: UIView

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher;

@property(nonatomic) NSInteger initialPage;
@property(nonatomic) NSInteger lastReportedIndex;
@property(nonatomic) NSInteger currentIndex;
@property(nonatomic) NSInteger pageMargin;
@property(nonatomic, readonly) BOOL scrollEnabled;
@property(nonatomic, readonly) BOOL showPageIndicator;
@property(nonatomic, readonly) UIScrollViewKeyboardDismissMode dismissKeyboard;
@property(nonatomic) UIPageViewControllerTransitionStyle transitionStyle;
@property(nonatomic) UIPageViewControllerNavigationOrientation orientation;
@property(nonatomic, copy) RCTDirectEventBlock onPageSelected;
@property(nonatomic, copy) RCTDirectEventBlock onPageScroll;
@property(nonatomic, copy) RCTDirectEventBlock onPageScrollStateChanged;
@property(nonatomic) BOOL overdrag;
@property(nonatomic) NSString* layoutDirection;
@property(nonatomic) CGRect previousBounds;
@property(nonatomic, assign) BOOL animating;

- (void)goTo:(NSInteger)index animated:(BOOL)animated;
- (void)shouldScroll:(BOOL)scrollEnabled;
- (void)shouldShowPageIndicator:(BOOL)showPageIndicator;
- (void)shouldDismissKeyboard:(NSString *)dismissKeyboard;

@end

NS_ASSUME_NONNULL_END
