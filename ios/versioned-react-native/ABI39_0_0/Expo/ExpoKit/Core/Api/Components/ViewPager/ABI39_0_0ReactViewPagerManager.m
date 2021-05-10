
#import "ABI39_0_0ReactViewPagerManager.h"

@implementation ABI39_0_0ReactViewPagerManager

#pragma mark - RTC

ABI39_0_0RCT_EXPORT_MODULE(ABI39_0_0RNCViewPager)

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI39_0_0RCTDirectEventBlock)

- (void) goToPage
                  : (nonnull NSNumber *)ABI39_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI39_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI39_0_0ReactNativePageView *view = (ABI39_0_0ReactNativePageView *)viewRegistry[ABI39_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI39_0_0ReactNativePageView class]]) {
            ABI39_0_0RCTLogError(@"Cannot find ABI39_0_0ReactNativePageView with tag #%@", ABI39_0_0ReactTag);
            return;
        }
        [view goTo:index.integerValue animated:animated];
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI39_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI39_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI39_0_0ReactNativePageView *view = (ABI39_0_0ReactNativePageView *)viewRegistry[ABI39_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI39_0_0ReactNativePageView class]]) {
            ABI39_0_0RCTLogError(@"Cannot find ABI39_0_0ReactNativePageView with tag #%@", ABI39_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI39_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI39_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI39_0_0ReactTag index:index animated:true];
}

ABI39_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI39_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI39_0_0ReactTag index:index animated:false];
}

ABI39_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI39_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI39_0_0ReactTag enabled:isEnabled];
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI39_0_0ReactNativePageView) {
    [view shouldScroll:[ABI39_0_0RCTConvert BOOL:json]];
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI39_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI39_0_0RCTConvert NSString:json]];
}

ABI39_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI39_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI39_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI39_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
