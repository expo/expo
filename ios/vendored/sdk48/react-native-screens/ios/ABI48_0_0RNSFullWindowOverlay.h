#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTViewComponentView.h>
#else
#import <ABI48_0_0React/ABI48_0_0RCTInvalidating.h>
#import <ABI48_0_0React/ABI48_0_0RCTView.h>
#endif

@interface ABI48_0_0RNSFullWindowOverlayManager : ABI48_0_0RCTViewManager

@end

@interface ABI48_0_0RNSFullWindowOverlayContainer : UIView

@end

@interface ABI48_0_0RNSFullWindowOverlay :
#ifdef RN_FABRIC_ENABLED
    ABI48_0_0RCTViewComponentView
#else
    ABI48_0_0RCTView <ABI48_0_0RCTInvalidating>
#endif // RN_FABRIC_ENABLED

#ifdef RN_FABRIC_ENABLED
@property (nonatomic) ABI48_0_0facebook::ABI48_0_0React::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) ABI48_0_0facebook::ABI48_0_0React::LayoutMetrics newLayoutMetrics;
#endif // RN_FABRIC_ENABLED

@end
