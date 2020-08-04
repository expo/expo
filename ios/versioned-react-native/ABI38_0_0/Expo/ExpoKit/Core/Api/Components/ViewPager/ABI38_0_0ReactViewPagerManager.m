
#import "ABI38_0_0ReactViewPagerManager.h"

@implementation ABI38_0_0ReactViewPagerManager

#pragma mark - RTC

ABI38_0_0RCT_EXPORT_MODULE(ABI38_0_0RNCViewPager)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI38_0_0RCTDirectEventBlock)

- (void) goToPage
                  : (nonnull NSNumber *)ABI38_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI38_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI38_0_0ReactNativePageView *view = (ABI38_0_0ReactNativePageView *)viewRegistry[ABI38_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI38_0_0ReactNativePageView class]]) {
            ABI38_0_0RCTLogError(@"Cannot find ABI38_0_0ReactNativePageView with tag #%@", ABI38_0_0ReactTag);
            return;
        }
        [view goTo:index animated:animated];
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI38_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI38_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI38_0_0ReactNativePageView *view = (ABI38_0_0ReactNativePageView *)viewRegistry[ABI38_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI38_0_0ReactNativePageView class]]) {
            ABI38_0_0RCTLogError(@"Cannot find ABI38_0_0ReactNativePageView with tag #%@", ABI38_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI38_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI38_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI38_0_0ReactTag index:index animated:true];
}

ABI38_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI38_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI38_0_0ReactTag index:index animated:false];
}

ABI38_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI38_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI38_0_0ReactTag enabled:isEnabled];
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI38_0_0ReactNativePageView) {
    [view shouldScroll:[ABI38_0_0RCTConvert BOOL:json]];
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI38_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI38_0_0RCTConvert NSString:json]];
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI38_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI38_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI38_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
