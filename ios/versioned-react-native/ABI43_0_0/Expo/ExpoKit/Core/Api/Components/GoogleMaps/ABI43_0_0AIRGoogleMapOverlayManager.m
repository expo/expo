#import "ABI43_0_0AIRGoogleMapOverlayManager.h"
#import "ABI43_0_0AIRGoogleMapOverlay.h"

@interface ABI43_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI43_0_0AIRGoogleMapOverlayManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRGoogleMapOverlay *overlay = [ABI43_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI43_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
