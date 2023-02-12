#import <React/RCTViewManager.h>

#ifdef RN_FABRIC_ENABLED
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
#ifdef RN_FABRIC_ENABLED
    RCTViewComponentView
#else
    RCTView <RCTInvalidating>
#endif // RN_FABRIC_ENABLED

#ifdef RN_FABRIC_ENABLED
@property (nonatomic) facebook::react::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) facebook::react::LayoutMetrics newLayoutMetrics;
#endif // RN_FABRIC_ENABLED

@end
