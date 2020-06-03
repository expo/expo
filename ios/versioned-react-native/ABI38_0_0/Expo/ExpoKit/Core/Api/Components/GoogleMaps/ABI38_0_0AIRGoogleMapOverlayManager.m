#import "ABI38_0_0AIRGoogleMapOverlayManager.h"
#import "ABI38_0_0AIRGoogleMapOverlay.h"

@interface ABI38_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI38_0_0AIRGoogleMapOverlayManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRGoogleMapOverlay *overlay = [ABI38_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI38_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
