
#import "ABI44_0_0ReactViewPagerManager.h"

@implementation ABI44_0_0ReactViewPagerManager

#pragma mark - RTC

ABI44_0_0RCT_EXPORT_MODULE(ABI44_0_0RNCViewPager)

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(layoutDirection, NSString)


- (void) goToPage
                  : (nonnull NSNumber *)ABI44_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI44_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI44_0_0ReactNativePageView *view = (ABI44_0_0ReactNativePageView *)viewRegistry[ABI44_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI44_0_0ReactNativePageView class]]) {
            ABI44_0_0RCTLogError(@"Cannot find ABI44_0_0ReactNativePageView with tag #%@", ABI44_0_0ReactTag);
            return;
        }
        [view goTo:index.integerValue animated:animated];
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI44_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI44_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI44_0_0ReactNativePageView *view = (ABI44_0_0ReactNativePageView *)viewRegistry[ABI44_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI44_0_0ReactNativePageView class]]) {
            ABI44_0_0RCTLogError(@"Cannot find ABI44_0_0ReactNativePageView with tag #%@", ABI44_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI44_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI44_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI44_0_0ReactTag index:index animated:true];
}

ABI44_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI44_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI44_0_0ReactTag index:index animated:false];
}

ABI44_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI44_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI44_0_0ReactTag enabled:isEnabled];
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI44_0_0ReactNativePageView) {
    [view shouldScroll:[ABI44_0_0RCTConvert BOOL:json]];
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI44_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI44_0_0RCTConvert NSString:json]];
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI44_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI44_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI44_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
