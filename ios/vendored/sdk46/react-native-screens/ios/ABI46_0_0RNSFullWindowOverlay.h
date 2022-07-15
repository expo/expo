#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>

#ifdef RN_FABRIC_ENABLED
#import <ABI46_0_0React/ABI46_0_0RCTViewComponentView.h>
#else
#import <ABI46_0_0React/ABI46_0_0RCTInvalidating.h>
#import <ABI46_0_0React/ABI46_0_0RCTView.h>
#endif

@interface ABI46_0_0RNSFullWindowOverlayManager : ABI46_0_0RCTViewManager

@end

@interface ABI46_0_0RNSFullWindowOverlayContainer : UIView

@end

@interface ABI46_0_0RNSFullWindowOverlay :
#ifdef RN_FABRIC_ENABLED
    ABI46_0_0RCTViewComponentView
#else
    ABI46_0_0RCTView <ABI46_0_0RCTInvalidating>
#endif // RN_FABRIC_ENABLED

#ifdef RN_FABRIC_ENABLED
@property (nonatomic) ABI46_0_0facebook::ABI46_0_0React::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) ABI46_0_0facebook::ABI46_0_0React::LayoutMetrics newLayoutMetrics;
#endif // RN_FABRIC_ENABLED

@end
