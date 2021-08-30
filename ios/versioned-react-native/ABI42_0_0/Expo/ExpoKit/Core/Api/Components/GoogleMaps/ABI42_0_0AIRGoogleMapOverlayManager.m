#import "ABI42_0_0AIRGoogleMapOverlayManager.h"
#import "ABI42_0_0AIRGoogleMapOverlay.h"

@interface ABI42_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI42_0_0AIRGoogleMapOverlayManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI42_0_0AIRGoogleMapOverlay *overlay = [ABI42_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI42_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
