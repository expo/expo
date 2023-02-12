#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTViewComponentView.h>
#else
#import <ABI47_0_0React/ABI47_0_0RCTInvalidating.h>
#import <ABI47_0_0React/ABI47_0_0RCTView.h>
#endif

@interface ABI47_0_0RNSFullWindowOverlayManager : ABI47_0_0RCTViewManager

@end

@interface ABI47_0_0RNSFullWindowOverlayContainer : UIView

@end

@interface ABI47_0_0RNSFullWindowOverlay :
#ifdef RN_FABRIC_ENABLED
    ABI47_0_0RCTViewComponentView
#else
    ABI47_0_0RCTView <ABI47_0_0RCTInvalidating>
#endif // RN_FABRIC_ENABLED

#ifdef RN_FABRIC_ENABLED
@property (nonatomic) ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics newLayoutMetrics;
#endif // RN_FABRIC_ENABLED

@end
