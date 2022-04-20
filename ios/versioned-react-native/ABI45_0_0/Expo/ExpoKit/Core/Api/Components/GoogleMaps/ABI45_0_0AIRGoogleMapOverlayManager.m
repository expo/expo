#import "ABI45_0_0AIRGoogleMapOverlayManager.h"
#import "ABI45_0_0AIRGoogleMapOverlay.h"

@interface ABI45_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI45_0_0AIRGoogleMapOverlayManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRGoogleMapOverlay *overlay = [ABI45_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI45_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
