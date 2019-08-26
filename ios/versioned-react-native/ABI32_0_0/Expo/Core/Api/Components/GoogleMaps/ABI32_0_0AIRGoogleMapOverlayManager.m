#import "ABI32_0_0AIRGoogleMapOverlayManager.h"
#import "ABI32_0_0AIRGoogleMapOverlay.h"

@interface ABI32_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI32_0_0AIRGoogleMapOverlayManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0AIRGoogleMapOverlay *overlay = [ABI32_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI32_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
