#import "ABI37_0_0AIRGoogleMapOverlayManager.h"
#import "ABI37_0_0AIRGoogleMapOverlay.h"

@interface ABI37_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI37_0_0AIRGoogleMapOverlayManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0AIRGoogleMapOverlay *overlay = [ABI37_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI37_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
