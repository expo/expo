#import "ABI33_0_0AIRGoogleMapOverlayManager.h"
#import "ABI33_0_0AIRGoogleMapOverlay.h"

@interface ABI33_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI33_0_0AIRGoogleMapOverlayManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0AIRGoogleMapOverlay *overlay = [ABI33_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI33_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
