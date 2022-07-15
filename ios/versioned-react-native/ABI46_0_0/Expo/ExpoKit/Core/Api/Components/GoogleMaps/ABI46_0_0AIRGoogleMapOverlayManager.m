#import "ABI46_0_0AIRGoogleMapOverlayManager.h"
#import "ABI46_0_0AIRGoogleMapOverlay.h"

@interface ABI46_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI46_0_0AIRGoogleMapOverlayManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0AIRGoogleMapOverlay *overlay = [ABI46_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI46_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
