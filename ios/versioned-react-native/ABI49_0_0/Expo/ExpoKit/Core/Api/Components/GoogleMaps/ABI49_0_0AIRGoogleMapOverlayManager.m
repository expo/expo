#import "ABI49_0_0AIRGoogleMapOverlayManager.h"
#import "ABI49_0_0AIRGoogleMapOverlay.h"

@interface ABI49_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI49_0_0AIRGoogleMapOverlayManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0AIRGoogleMapOverlay *overlay = [ABI49_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI49_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
