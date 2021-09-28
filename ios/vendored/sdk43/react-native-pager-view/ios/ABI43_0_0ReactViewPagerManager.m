
#import "ABI43_0_0ReactViewPagerManager.h"

@implementation ABI43_0_0ReactViewPagerManager

#pragma mark - RTC

ABI43_0_0RCT_EXPORT_MODULE(ABI43_0_0RNCViewPager)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(layoutDirection, NSString)


- (void) goToPage
                  : (nonnull NSNumber *)ABI43_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI43_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI43_0_0ReactNativePageView *view = (ABI43_0_0ReactNativePageView *)viewRegistry[ABI43_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI43_0_0ReactNativePageView class]]) {
            ABI43_0_0RCTLogError(@"Cannot find ABI43_0_0ReactNativePageView with tag #%@", ABI43_0_0ReactTag);
            return;
        }
        [view goTo:index.integerValue animated:animated];
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI43_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI43_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI43_0_0ReactNativePageView *view = (ABI43_0_0ReactNativePageView *)viewRegistry[ABI43_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI43_0_0ReactNativePageView class]]) {
            ABI43_0_0RCTLogError(@"Cannot find ABI43_0_0ReactNativePageView with tag #%@", ABI43_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI43_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI43_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI43_0_0ReactTag index:index animated:true];
}

ABI43_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI43_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI43_0_0ReactTag index:index animated:false];
}

ABI43_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI43_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI43_0_0ReactTag enabled:isEnabled];
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI43_0_0ReactNativePageView) {
    [view shouldScroll:[ABI43_0_0RCTConvert BOOL:json]];
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI43_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI43_0_0RCTConvert NSString:json]];
}

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI43_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI43_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI43_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
