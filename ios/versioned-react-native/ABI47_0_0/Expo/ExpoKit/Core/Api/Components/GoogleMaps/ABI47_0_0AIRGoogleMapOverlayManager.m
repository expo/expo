#import "ABI47_0_0AIRGoogleMapOverlayManager.h"
#import "ABI47_0_0AIRGoogleMapOverlay.h"

@interface ABI47_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI47_0_0AIRGoogleMapOverlayManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0AIRGoogleMapOverlay *overlay = [ABI47_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI47_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI47_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
