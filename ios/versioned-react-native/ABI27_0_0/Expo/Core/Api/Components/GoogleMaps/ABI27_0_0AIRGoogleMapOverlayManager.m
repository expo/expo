#import "ABI27_0_0AIRGoogleMapOverlayManager.h"
#import "ABI27_0_0AIRGoogleMapOverlay.h"

@interface ABI27_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI27_0_0AIRGoogleMapOverlayManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI27_0_0AIRGoogleMapOverlay *overlay = [ABI27_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI27_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
