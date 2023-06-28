
#import "ABI49_0_0ReactViewPagerManager.h"

@implementation ABI49_0_0ReactViewPagerManager

#pragma mark - RTC

ABI49_0_0RCT_EXPORT_MODULE(ABI49_0_0RNCViewPager)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(layoutDirection, NSString)


- (void) goToPage
                  : (nonnull NSNumber *)ABI49_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI49_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI49_0_0ReactNativePageView *view = (ABI49_0_0ReactNativePageView *)viewRegistry[ABI49_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI49_0_0ReactNativePageView class]]) {
            ABI49_0_0RCTLogError(@"Cannot find ABI49_0_0ReactNativePageView with tag #%@", ABI49_0_0ReactTag);
            return;
        }
        if (!animated || !view.animating) {
            [view goTo:index.integerValue animated:animated];
        }
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI49_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI49_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI49_0_0ReactNativePageView *view = (ABI49_0_0ReactNativePageView *)viewRegistry[ABI49_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI49_0_0ReactNativePageView class]]) {
            ABI49_0_0RCTLogError(@"Cannot find ABI49_0_0ReactNativePageView with tag #%@", ABI49_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI49_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI49_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI49_0_0ReactTag index:index animated:true];
}

ABI49_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI49_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI49_0_0ReactTag index:index animated:false];
}

ABI49_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI49_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI49_0_0ReactTag enabled:isEnabled];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI49_0_0ReactNativePageView) {
    [view shouldScroll:[ABI49_0_0RCTConvert BOOL:json]];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI49_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI49_0_0RCTConvert NSString:json]];
}


- (UIView *)view {
    return [[ABI49_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
