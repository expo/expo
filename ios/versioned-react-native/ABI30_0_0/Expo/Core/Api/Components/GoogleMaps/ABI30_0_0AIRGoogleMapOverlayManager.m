#import "ABI30_0_0AIRGoogleMapOverlayManager.h"
#import "ABI30_0_0AIRGoogleMapOverlay.h"

@interface ABI30_0_0AIRGoogleMapOverlayManager()

@end

@implementation ABI30_0_0AIRGoogleMapOverlayManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0AIRGoogleMapOverlay *overlay = [ABI30_0_0AIRGoogleMapOverlay new];
  overlay.bridge = self.bridge;
  return overlay;
}

ABI30_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end
