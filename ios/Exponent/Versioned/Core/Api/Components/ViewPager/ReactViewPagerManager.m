
#import "ReactViewPagerManager.h"

@implementation ReactViewPagerManager

#pragma mark - RTC

RCT_EXPORT_MODULE(RNCViewPager)

RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
RCT_EXPORT_VIEW_PROPERTY(onPageSelected, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPageScroll, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, RCTDirectEventBlock)

- (void) goToPage
                  : (nonnull NSNumber *)reactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ReactNativePageView *view = (ReactNativePageView *)viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[ReactNativePageView class]]) {
            RCTLogError(@"Cannot find ReactNativePageView with tag #%@", reactTag);
            return;
        }
        [view goTo:index animated:animated];
    }];
}

RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)reactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:reactTag index:index animated:true];
}

RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)reactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:reactTag index:index animated:false];
}

RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ReactNativePageView) {
    [view shouldScroll:[RCTConvert BOOL:json]];
}

RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ReactNativePageView) {
    [view shouldDismissKeyboard:[RCTConvert NSString:json]];
}

RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ReactNativePageView) {
    [view shouldShowPageIndicator:[RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
