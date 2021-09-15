
#import "ABI42_0_0ReactViewPagerManager.h"

@implementation ABI42_0_0ReactViewPagerManager

#pragma mark - RTC

ABI42_0_0RCT_EXPORT_MODULE(ABI42_0_0RNCViewPager)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)


- (void) goToPage
                  : (nonnull NSNumber *)ABI42_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI42_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI42_0_0ReactNativePageView *view = (ABI42_0_0ReactNativePageView *)viewRegistry[ABI42_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI42_0_0ReactNativePageView class]]) {
            ABI42_0_0RCTLogError(@"Cannot find ABI42_0_0ReactNativePageView with tag #%@", ABI42_0_0ReactTag);
            return;
        }
        [view goTo:index.integerValue animated:animated];
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI42_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI42_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI42_0_0ReactNativePageView *view = (ABI42_0_0ReactNativePageView *)viewRegistry[ABI42_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI42_0_0ReactNativePageView class]]) {
            ABI42_0_0RCTLogError(@"Cannot find ABI42_0_0ReactNativePageView with tag #%@", ABI42_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI42_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI42_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI42_0_0ReactTag index:index animated:true];
}

ABI42_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI42_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI42_0_0ReactTag index:index animated:false];
}

ABI42_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI42_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI42_0_0ReactTag enabled:isEnabled];
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI42_0_0ReactNativePageView) {
    [view shouldScroll:[ABI42_0_0RCTConvert BOOL:json]];
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI42_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI42_0_0RCTConvert NSString:json]];
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI42_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI42_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI42_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
