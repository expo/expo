#import "ABI40_0_0AIRGoogleMapOverlayManager.h"
#import "ABI40_0_0AIRGoogleMapOverlay.h"

@interface ABI40_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI40_0_0AIRGoogleMapOverlayManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0AIRGoogleMapOverlay *overlay = [ABI40_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI40_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
