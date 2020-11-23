
#import "ABI40_0_0ReactViewPagerManager.h"

@implementation ABI40_0_0ReactViewPagerManager

#pragma mark - RTC

ABI40_0_0RCT_EXPORT_MODULE(ABI40_0_0RNCViewPager)

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI40_0_0RCTDirectEventBlock)

- (void) goToPage
                  : (nonnull NSNumber *)ABI40_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI40_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI40_0_0ReactNativePageView *view = (ABI40_0_0ReactNativePageView *)viewRegistry[ABI40_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI40_0_0ReactNativePageView class]]) {
            ABI40_0_0RCTLogError(@"Cannot find ABI40_0_0ReactNativePageView with tag #%@", ABI40_0_0ReactTag);
            return;
        }
        [view goTo:index.integerValue animated:animated];
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI40_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI40_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI40_0_0ReactNativePageView *view = (ABI40_0_0ReactNativePageView *)viewRegistry[ABI40_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI40_0_0ReactNativePageView class]]) {
            ABI40_0_0RCTLogError(@"Cannot find ABI40_0_0ReactNativePageView with tag #%@", ABI40_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI40_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI40_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI40_0_0ReactTag index:index animated:true];
}

ABI40_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI40_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI40_0_0ReactTag index:index animated:false];
}

ABI40_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI40_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI40_0_0ReactTag enabled:isEnabled];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI40_0_0ReactNativePageView) {
    [view shouldScroll:[ABI40_0_0RCTConvert BOOL:json]];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI40_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI40_0_0RCTConvert NSString:json]];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI40_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI40_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI40_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
