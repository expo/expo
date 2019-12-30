#import "ABI36_0_0AIRGoogleMapOverlayManager.h"
#import "ABI36_0_0AIRGoogleMapOverlay.h"

@interface ABI36_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI36_0_0AIRGoogleMapOverlayManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapOverlay *overlay = [ABI36_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI36_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
