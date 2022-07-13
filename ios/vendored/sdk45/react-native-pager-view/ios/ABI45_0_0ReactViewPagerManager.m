
#import "ABI45_0_0ReactViewPagerManager.h"

@implementation ABI45_0_0ReactViewPagerManager

#pragma mark - RTC

ABI45_0_0RCT_EXPORT_MODULE(ABI45_0_0RNCViewPager)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(initialPage, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(pageMargin, NSInteger)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(transitionStyle, UIPageViewControllerTransitionStyle)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(orientation, UIPageViewControllerNavigationOrientation)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPageSelected, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScroll, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPageScrollStateChanged, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(overdrag, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(layoutDirection, NSString)


- (void) goToPage
                  : (nonnull NSNumber *)ABI45_0_0ReactTag index
                  : (nonnull NSNumber *)index animated
                  : (BOOL)animated {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI45_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI45_0_0ReactNativePageView *view = (ABI45_0_0ReactNativePageView *)viewRegistry[ABI45_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI45_0_0ReactNativePageView class]]) {
            ABI45_0_0RCTLogError(@"Cannot find ABI45_0_0ReactNativePageView with tag #%@", ABI45_0_0ReactTag);
            return;
        }
        if (!animated || !view.animating) {
            [view goTo:index.integerValue animated:animated];
        }
    }];
}

- (void) changeScrollEnabled
: (nonnull NSNumber *)ABI45_0_0ReactTag enabled
: (BOOL)enabled {
    [self.bridge.uiManager addUIBlock:^(
                                        ABI45_0_0RCTUIManager *uiManager,
                                        NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        ABI45_0_0ReactNativePageView *view = (ABI45_0_0ReactNativePageView *)viewRegistry[ABI45_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI45_0_0ReactNativePageView class]]) {
            ABI45_0_0RCTLogError(@"Cannot find ABI45_0_0ReactNativePageView with tag #%@", ABI45_0_0ReactTag);
            return;
        }
        [view shouldScroll:enabled];
    }];
}

ABI45_0_0RCT_EXPORT_METHOD(setPage
                  : (nonnull NSNumber *)ABI45_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI45_0_0ReactTag index:index animated:true];
}

ABI45_0_0RCT_EXPORT_METHOD(setPageWithoutAnimation
                  : (nonnull NSNumber *)ABI45_0_0ReactTag index
                  : (nonnull NSNumber *)index) {
    [self goToPage:ABI45_0_0ReactTag index:index animated:false];
}

ABI45_0_0RCT_EXPORT_METHOD(setScrollEnabled
                  : (nonnull NSNumber *)ABI45_0_0ReactTag enabled
                  : (nonnull NSNumber *)enabled) {
    BOOL isEnabled = [enabled boolValue];
    [self changeScrollEnabled:ABI45_0_0ReactTag enabled:isEnabled];
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI45_0_0ReactNativePageView) {
    [view shouldScroll:[ABI45_0_0RCTConvert BOOL:json]];
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDismissMode, NSString, ABI45_0_0ReactNativePageView) {
    [view shouldDismissKeyboard:[ABI45_0_0RCTConvert NSString:json]];
}

ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(showPageIndicator, BOOL, ABI45_0_0ReactNativePageView) {
    [view shouldShowPageIndicator:[ABI45_0_0RCTConvert BOOL:json]];
}

- (UIView *)view {
    return [[ABI45_0_0ReactNativePageView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

@end
