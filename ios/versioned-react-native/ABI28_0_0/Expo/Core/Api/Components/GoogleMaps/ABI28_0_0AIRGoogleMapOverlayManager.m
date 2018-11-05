#import "ABI28_0_0AIRGoogleMapOverlayManager.h"
#import "ABI28_0_0AIRGoogleMapOverlay.h"

@interface ABI28_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI28_0_0AIRGoogleMapOverlayManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI28_0_0AIRGoogleMapOverlay *overlay = [ABI28_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI28_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
