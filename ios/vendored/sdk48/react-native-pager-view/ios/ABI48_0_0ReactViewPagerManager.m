
#import "ABI48_0_0ReactViewPagerManager.h"

@implementation ABI48_0_0ReactViewPagerManager

#pragma mark - RTC

ABI48_0_0RCT_EXPORT_MODULE(ABI48_0_0RNCViewPager)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(layoutDirection, NSString)


- (void) goToPage
                  : (nonnull NSNumber *)ABI48_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI48_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI48_0_0ReactNativePageView *view = (ABI48_0_0ReactNativePageView *)viewRegistry[ABI48_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI48_0_0ReactNativePageView class]]) {
            ABI48_0_0RCTLogError(@"Cannot find ABI48_0_0ReactNativePageView with tag #%@", ABI48_0_0ReactTag);
            return;
        }
        if (!animated || !view.animating) {
            [view goTo:index.integerValue animated:animated];
        }
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI48_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI48_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI48_0_0ReactNativePageView *view = (ABI48_0_0ReactNativePageView *)viewRegistry[ABI48_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI48_0_0ReactNativePageView class]]) {
            ABI48_0_0RCTLogError(@"Cannot find ABI48_0_0ReactNativePageView with tag #%@", ABI48_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI48_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI48_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI48_0_0ReactTag index:index animated:true];
}

ABI48_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI48_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI48_0_0ReactTag index:index animated:false];
}

ABI48_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI48_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI48_0_0ReactTag enabled:isEnabled];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI48_0_0ReactNativePageView) {
    [view shouldScroll:[ABI48_0_0RCTConvert BOOL:json]];
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI48_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI48_0_0RCTConvert NSString:json]];
}


- (UIView *)view {
    return [[ABI48_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
