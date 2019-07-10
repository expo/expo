#import "ABI34_0_0AIRGoogleMapOverlayManager.h"
#import "ABI34_0_0AIRGoogleMapOverlay.h"

@interface ABI34_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI34_0_0AIRGoogleMapOverlayManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI34_0_0AIRGoogleMapOverlay *overlay = [ABI34_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI34_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
