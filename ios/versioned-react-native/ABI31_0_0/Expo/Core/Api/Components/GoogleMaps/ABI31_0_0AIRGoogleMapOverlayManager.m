#import "ABI31_0_0AIRGoogleMapOverlayManager.h"
#import "ABI31_0_0AIRGoogleMapOverlay.h"

@interface ABI31_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI31_0_0AIRGoogleMapOverlayManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI31_0_0AIRGoogleMapOverlay *overlay = [ABI31_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI31_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
