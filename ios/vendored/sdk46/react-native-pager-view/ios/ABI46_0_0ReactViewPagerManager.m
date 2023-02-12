
#import "ABI46_0_0ReactViewPagerManager.h"

@implementation ABI46_0_0ReactViewPagerManager

#pragma mark - RTC

ABI46_0_0RCT_EXPORT_MODULE(ABI46_0_0RNCViewPager)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(layoutDirection, NSString)


- (void) goToPage
                  : (nonnull NSNumber *)ABI46_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI46_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI46_0_0ReactNativePageView *view = (ABI46_0_0ReactNativePageView *)viewRegistry[ABI46_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI46_0_0ReactNativePageView class]]) {
            ABI46_0_0RCTLogError(@"Cannot find ABI46_0_0ReactNativePageView with tag #%@", ABI46_0_0ReactTag);
            return;
        }
        if (!animated || !view.animating) {
            [view goTo:index.integerValue animated:animated];
        }
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI46_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI46_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI46_0_0ReactNativePageView *view = (ABI46_0_0ReactNativePageView *)viewRegistry[ABI46_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI46_0_0ReactNativePageView class]]) {
            ABI46_0_0RCTLogError(@"Cannot find ABI46_0_0ReactNativePageView with tag #%@", ABI46_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI46_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI46_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI46_0_0ReactTag index:index animated:true];
}

ABI46_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI46_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI46_0_0ReactTag index:index animated:false];
}

ABI46_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI46_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI46_0_0ReactTag enabled:isEnabled];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI46_0_0ReactNativePageView) {
    [view shouldScroll:[ABI46_0_0RCTConvert BOOL:json]];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI46_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI46_0_0RCTConvert NSString:json]];
}

ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI46_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI46_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI46_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
