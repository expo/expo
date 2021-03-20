#import "ABI41_0_0AIRGoogleMapOverlayManager.h"
#import "ABI41_0_0AIRGoogleMapOverlay.h"

@interface ABI41_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI41_0_0AIRGoogleMapOverlayManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRGoogleMapOverlay *overlay = [ABI41_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI41_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(opacity, opacity, CGFloat)

@end
