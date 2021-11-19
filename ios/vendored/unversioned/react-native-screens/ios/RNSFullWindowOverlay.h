#import <React/RCTInvalidating.h>
#import <React/RCTView.h>
#import <React/RCTViewManager.h>

@interface RNSFullWindowOverlayManager : RCTViewManager

@end

@interface RNSFullWindowOverlayContainer : UIView

@end

@interface RNSFullWindowOverlay : RCTView <RCTInvalidating>

@end
