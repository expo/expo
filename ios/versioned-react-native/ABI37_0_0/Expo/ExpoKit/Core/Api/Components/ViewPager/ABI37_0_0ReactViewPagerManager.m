
#import "ABI37_0_0ReactViewPagerManager.h"

@implementation ABI37_0_0ReactViewPagerManager

#pragma mark - RTC

ABI37_0_0RCT_EXPORT_MODULE(ABI37_0_0RNCViewPager)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI37_0_0RCTDirectEventBlock)

- (void) goToPage
                  : (nonnull NSNumber *)ABI37_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI37_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI37_0_0ReactNativePageView *view = (ABI37_0_0ReactNativePageView *)viewRegistry[ABI37_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI37_0_0ReactNativePageView class]]) {
            ABI37_0_0RCTLogError(@"Cannot find ABI37_0_0ReactNativePageView with tag #%@", ABI37_0_0ReactTag);
            return;
        }
        [view goTo:index animated:animated];
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI37_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI37_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI37_0_0ReactNativePageView *view = (ABI37_0_0ReactNativePageView *)viewRegistry[ABI37_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI37_0_0ReactNativePageView class]]) {
            ABI37_0_0RCTLogError(@"Cannot find ABI37_0_0ReactNativePageView with tag #%@", ABI37_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI37_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI37_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI37_0_0ReactTag index:index animated:true];
}

ABI37_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI37_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI37_0_0ReactTag index:index animated:false];
}

ABI37_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI37_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI37_0_0ReactTag enabled:isEnabled];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI37_0_0ReactNativePageView) {
    [view shouldScroll:[ABI37_0_0RCTConvert BOOL:json]];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI37_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI37_0_0RCTConvert NSString:json]];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI37_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI37_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI37_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
