#import "ABI48_0_0AIRGoogleMapOverlayManager.h"
#import "ABI48_0_0AIRGoogleMapOverlay.h"

@interface ABI48_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI48_0_0AIRGoogleMapOverlayManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapOverlay *overlay = [ABI48_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI48_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
