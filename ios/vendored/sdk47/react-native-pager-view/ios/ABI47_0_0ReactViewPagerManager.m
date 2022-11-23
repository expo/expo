
#import "ABI47_0_0ReactViewPagerManager.h"

@implementation ABI47_0_0ReactViewPagerManager

#pragma mark - RTC

ABI47_0_0RCT_EXPORT_MODULE(ABI47_0_0RNCViewPager)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI47_0_0RCTDirectEventBlock)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(layoutDirection, NSString)


- (void) goToPage
                  : (nonnull NSNumber *)ABI47_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI47_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI47_0_0ReactNativePageView *view = (ABI47_0_0ReactNativePageView *)viewRegistry[ABI47_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI47_0_0ReactNativePageView class]]) {
            ABI47_0_0RCTLogError(@"Cannot find ABI47_0_0ReactNativePageView with tag #%@", ABI47_0_0ReactTag);
            return;
        }
        if (!animated || !view.animating) {
            [view goTo:index.integerValue animated:animated];
        }
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI47_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI47_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI47_0_0ReactNativePageView *view = (ABI47_0_0ReactNativePageView *)viewRegistry[ABI47_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI47_0_0ReactNativePageView class]]) {
            ABI47_0_0RCTLogError(@"Cannot find ABI47_0_0ReactNativePageView with tag #%@", ABI47_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI47_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI47_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI47_0_0ReactTag index:index animated:true];
}

ABI47_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI47_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI47_0_0ReactTag index:index animated:false];
}

ABI47_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI47_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI47_0_0ReactTag enabled:isEnabled];
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI47_0_0ReactNativePageView) {
    [view shouldScroll:[ABI47_0_0RCTConvert BOOL:json]];
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI47_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI47_0_0RCTConvert NSString:json]];
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI47_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI47_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI47_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
