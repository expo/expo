#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#else
#import <ABI49_0_0React/ABI49_0_0RCTInvalidating.h>
#import <ABI49_0_0React/ABI49_0_0RCTView.h>
#endif

@interface ABI49_0_0RNSFullWindowOverlayManager : ABI49_0_0RCTViewManager

@end

@interface ABI49_0_0RNSFullWindowOverlayContainer : UIView

@end

@interface ABI49_0_0RNSFullWindowOverlay :
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    ABI49_0_0RCTViewComponentView
#else
    ABI49_0_0RCTView <ABI49_0_0RCTInvalidating>
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
@property (nonatomic) ABI49_0_0facebook::ABI49_0_0React::LayoutMetrics oldLayoutMetrics;
@property (nonatomic) ABI49_0_0facebook::ABI49_0_0React::LayoutMetrics newLayoutMetrics;
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@end
