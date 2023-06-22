#import <React/RCTViewManager.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#else
#import <React/RCTInvalidating.h>
#import <React/RCTView.h>
#endif

@interface RNSFullWindowOverlayManager : RCTViewManager

@end

@interface RNSFullWindowOverlayContainer : UIView

@end

@interface RNSFullWindowOverlay :
#ifdef RCT_NEW_ARCH_ENABLED
    RCTViewComponentView
#else
    RCTView <RCTInvalidating>
#endif // RCT_NEW_ARCH_ENABLED

#ifdef RCT_NEW_ARCH_ENABLED
@property (nonatomic) facebook::react::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) facebook::react::LayoutMetrics newLayoutMetrics;
#endif // RCT_NEW_ARCH_ENABLED

@end
