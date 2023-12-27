#import "ABI44_0_0AIRGoogleMapOverlayManager.h"
#import "ABI44_0_0AIRGoogleMapOverlay.h"

@interface ABI44_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI44_0_0AIRGoogleMapOverlayManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRGoogleMapOverlay *overlay = [ABI44_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI44_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(bearing, bearing, double)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
