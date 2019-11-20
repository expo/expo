
#import "ABI36_0_0ReactViewPagerManager.h"

@implementation ABI36_0_0ReactViewPagerManager

#pragma mark - RTC

ABI36_0_0RCT_EXPORT_MODULE(ABI36_0_0RNCViewPager)

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI36_0_0RCTDirectEventBlock)

- (void) goToPage
                  : (nonnull NSNumber *)ABI36_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI36_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI36_0_0ReactNativePageView *view = (ABI36_0_0ReactNativePageView *)viewRegistry[ABI36_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI36_0_0ReactNativePageView class]]) {
            ABI36_0_0RCTLogError(@"Cannot find ABI36_0_0ReactNativePageView with tag #%@", ABI36_0_0ReactTag);
            return;
        }
        [view goTo:index animated:animated];
    }];
}

ABI36_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI36_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI36_0_0ReactTag index:index animated:true];
}

ABI36_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI36_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI36_0_0ReactTag index:index animated:false];
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI36_0_0ReactNativePageView) {
    [view shouldScroll:[ABI36_0_0RCTConvert BOOL:json]];
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI36_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI36_0_0RCTConvert NSString:json]];
}

ABI36_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI36_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI36_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI36_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
